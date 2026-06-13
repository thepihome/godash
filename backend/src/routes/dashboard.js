/**
 * Dashboard analytics routes for BI visualizations
 */

import { query } from '../utils/db.js';
import { addCorsHeaders } from '../utils/cors.js';

const CHART_COLORS = ['#2B3D7E', '#3d5299', '#5b7fd4', '#059669', '#d97706', '#64748b', '#1e2d5f', '#94a3b8'];

function jsonResponse(env, request, data, status = 200) {
  return addCorsHeaders(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
    env,
    request
  );
}

async function getJobsByStatus(env) {
  const rows = await query(
    env,
    `SELECT status, COUNT(*) as count FROM jobs GROUP BY status ORDER BY count DESC`
  );
  return rows.map((r, i) => ({
    name: r.status || 'unknown',
    value: parseInt(r.count || 0, 10),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function getMatchesByStatus(env, user) {
  let sql = `SELECT status, COUNT(*) as count FROM job_matches`;
  const params = [];
  if (user.role === 'candidate') {
    sql += ' WHERE candidate_id = ?';
    params.push(user.id);
  }
  sql += ' GROUP BY status ORDER BY count DESC';
  const rows = await query(env, sql, params);
  return rows.map((r, i) => ({
    name: r.status || 'unknown',
    value: parseInt(r.count || 0, 10),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function getMatchScoreBuckets(env, userId) {
  const rows = await query(
    env,
    `SELECT
       CASE
         WHEN match_score >= 80 THEN '80-100'
         WHEN match_score >= 60 THEN '60-79'
         WHEN match_score >= 40 THEN '40-59'
         ELSE '0-39'
       END as bucket,
       COUNT(*) as count
     FROM job_matches
     WHERE candidate_id = ?
     GROUP BY bucket
     ORDER BY bucket DESC`,
    [userId]
  );
  return rows.map((r, i) => ({
    name: r.bucket,
    value: parseInt(r.count || 0, 10),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function getCandidatesByCity(env, consultantId) {
  let sql = `
    SELECT cp.city as name, COUNT(*) as value
    FROM users u
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    WHERE u.role = 'candidate' AND u.is_active = 1 AND cp.city IS NOT NULL AND cp.city != ''
  `;
  const params = [];
  if (consultantId) {
    sql += ` AND u.id IN (SELECT candidate_id FROM consultant_assignments WHERE consultant_id = ?)`;
    params.push(consultantId);
  }
  sql += ' GROUP BY cp.city ORDER BY value DESC LIMIT 8';
  const rows = await query(env, sql, params);
  return rows.map((r, i) => ({
    name: r.name,
    value: parseInt(r.value || 0, 10),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function getTimesheetHoursTrend(env, userId) {
  const rows = await query(
    env,
    `SELECT strftime('%Y-%m', date) as month, SUM(hours) as hours
     FROM timesheets
     WHERE user_id = ?
     GROUP BY month
     ORDER BY month ASC
     LIMIT 12`,
    [userId]
  );
  return rows.map((r) => ({
    name: r.month,
    hours: parseFloat(r.hours || 0),
  }));
}

async function getUsersByRole(env) {
  const rows = await query(
    env,
    `SELECT role as name, COUNT(*) as value
     FROM users WHERE is_active = 1
     GROUP BY role ORDER BY value DESC`
  );
  return rows.map((r, i) => ({
    name: r.name,
    value: parseInt(r.value || 0, 10),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

async function getPipelineTrend(env) {
  const rows = await query(
    env,
    `SELECT strftime('%Y-%m', matched_at) as month, COUNT(*) as matches
     FROM job_matches
     WHERE matched_at IS NOT NULL
     GROUP BY month
     ORDER BY month ASC
     LIMIT 12`
  );
  return rows.map((r) => ({
    name: r.month,
    matches: parseInt(r.matches || 0, 10),
  }));
}

async function getSummaryStats(env, user) {
  const stats = {};

  const jobs = await query(env, "SELECT COUNT(*) as c FROM jobs WHERE status = 'active'");
  stats.active_jobs = parseInt(jobs[0]?.c || 0, 10);

  if (user.role === 'candidate') {
    const [matches, resumes, avgScore] = await Promise.all([
      query(env, 'SELECT COUNT(*) as c FROM job_matches WHERE candidate_id = ?', [user.id]),
      query(env, 'SELECT COUNT(*) as c FROM resumes WHERE user_id = ?', [user.id]),
      query(env, 'SELECT AVG(match_score) as avg FROM job_matches WHERE candidate_id = ?', [user.id]),
    ]);
    stats.my_matches = parseInt(matches[0]?.c || 0, 10);
    stats.my_resumes = parseInt(resumes[0]?.c || 0, 10);
    stats.avg_match_score = avgScore[0]?.avg ? parseFloat(avgScore[0].avg).toFixed(1) : null;
  }

  if (user.role === 'consultant' || user.role === 'admin') {
    const candidates = await query(
      env,
      "SELECT COUNT(*) as c FROM users WHERE role = 'candidate' AND is_active = 1"
    );
    stats.total_candidates = parseInt(candidates[0]?.c || 0, 10);
  }

  if (user.role === 'consultant') {
    const [assigned, pendingTs] = await Promise.all([
      query(env, 'SELECT COUNT(*) as c FROM consultant_assignments WHERE consultant_id = ?', [user.id]),
      query(env, "SELECT COUNT(*) as c FROM timesheets WHERE user_id = ? AND status = 'draft'", [user.id]),
    ]);
    stats.assigned_candidates = parseInt(assigned[0]?.c || 0, 10);
    stats.pending_timesheets = parseInt(pendingTs[0]?.c || 0, 10);
  }

  if (user.role === 'admin') {
    const users = await query(env, 'SELECT COUNT(*) as c FROM users WHERE is_active = 1');
    stats.total_users = parseInt(users[0]?.c || 0, 10);
  }

  return stats;
}

export async function handleDashboard(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/dashboard/analytics' && method === 'GET') {
    try {
      const summary = await getSummaryStats(env, user);

      const charts = [];

      if (user.role === 'admin' || user.role === 'consultant') {
        charts.push({
          id: 'jobs_by_status',
          title: 'Jobs by Status',
          type: 'bar',
          data: await getJobsByStatus(env),
        });
        charts.push({
          id: 'matches_by_status',
          title: 'Match Pipeline',
          type: 'pie',
          data: await getMatchesByStatus(env, user),
        });
        charts.push({
          id: 'candidates_by_city',
          title: 'Candidates by City',
          type: 'bar',
          data: await getCandidatesByCity(env, user.role === 'consultant' ? user.id : null),
        });
        charts.push({
          id: 'pipeline_trend',
          title: 'Matching Activity (12 mo)',
          type: 'line',
          data: await getPipelineTrend(env),
          dataKey: 'matches',
        });
      }

      if (user.role === 'admin') {
        charts.push({
          id: 'users_by_role',
          title: 'Users by Role',
          type: 'pie',
          data: await getUsersByRole(env),
        });
      }

      if (user.role === 'candidate') {
        charts.push({
          id: 'my_matches_status',
          title: 'My Matches by Status',
          type: 'pie',
          data: await getMatchesByStatus(env, user),
        });
        charts.push({
          id: 'match_scores',
          title: 'Match Score Distribution',
          type: 'bar',
          data: await getMatchScoreBuckets(env, user.id),
        });
      }

      if (user.role === 'consultant') {
        charts.push({
          id: 'timesheet_trend',
          title: 'Timesheet Hours (12 mo)',
          type: 'line',
          data: await getTimesheetHoursTrend(env, user.id),
          dataKey: 'hours',
        });
      }

      return jsonResponse(env, request, { summary, charts });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return jsonResponse(env, request, { error: 'Failed to load analytics' }, 500);
    }
  }

  return jsonResponse(env, request, { error: 'Not found' }, 404);
}
