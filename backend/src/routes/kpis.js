/**
 * KPIs routes for Cloudflare Workers
 */

import { query, queryOne, execute } from '../utils/db.js';
import { addCorsHeaders } from '../utils/cors.js';

export async function handleKPIs(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Get available metric types
  if (path === '/api/kpis/metric-types' && method === 'GET') {
    const metricTypes = [
      { value: 'total_jobs', label: 'Total Active Jobs', roles: ['candidate', 'consultant', 'admin'] },
      { value: 'total_matches', label: 'Total Matches', roles: ['candidate'] },
      { value: 'average_match_score', label: 'Average Match Score', roles: ['candidate'] },
      { value: 'total_resumes', label: 'Total Resumes', roles: ['candidate'] },
      { value: 'assigned_candidates', label: 'Assigned Candidates', roles: ['consultant'] },
      { value: 'pending_timesheets', label: 'Pending Timesheets', roles: ['consultant'] },
      { value: 'total_users', label: 'Total Users', roles: ['admin'] },
      { value: 'total_candidates', label: 'Total Candidates', roles: ['admin', 'consultant'] },
    ];

    const availableTypes = metricTypes.filter(mt => mt.roles.includes(user.role));
    
    return addCorsHeaders(
      new Response(
        JSON.stringify(availableTypes),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      env,
      request
    );
  }

  // Get user's KPIs
  if (path === '/api/kpis/my-kpis' && method === 'GET') {
    try {
      const kpis = await query(
        env,
        `SELECT * FROM kpis 
         WHERE user_id = ? AND is_active = 1
         ORDER BY display_order, created_at DESC`,
        [user.id]
      );

      // Calculate current values for each KPI
      const kpisWithValues = await Promise.all(
        kpis.map(async (kpi) => {
          let currentValue = null;

          try {
            switch (kpi.metric_type) {
              case 'total_jobs':
                const jobsResult = await query(
                  env,
                  "SELECT COUNT(*) as count FROM jobs WHERE status = 'active'"
                );
                currentValue = parseInt(jobsResult[0]?.count || 0);
                break;

              case 'total_matches':
                const matchesResult = await query(
                  env,
                  'SELECT COUNT(*) as count FROM job_matches WHERE candidate_id = ?',
                  [user.id]
                );
                currentValue = parseInt(matchesResult[0]?.count || 0);
                break;

              case 'average_match_score':
                const avgScoreResult = await query(
                  env,
                  'SELECT AVG(match_score) as avg FROM job_matches WHERE candidate_id = ?',
                  [user.id]
                );
                const avg = avgScoreResult[0]?.avg;
                currentValue = avg ? parseFloat(avg).toFixed(2) : null;
                break;

              case 'total_resumes':
                const resumesResult = await query(
                  env,
                  'SELECT COUNT(*) as count FROM resumes WHERE user_id = ?',
                  [user.id]
                );
                currentValue = parseInt(resumesResult[0]?.count || 0);
                break;

              case 'assigned_candidates':
                if (user.role === 'consultant') {
                  const assignedResult = await query(
                    env,
                    'SELECT COUNT(*) as count FROM consultant_assignments WHERE consultant_id = ?',
                    [user.id]
                  );
                  currentValue = parseInt(assignedResult[0]?.count || 0);
                }
                break;

              case 'pending_timesheets':
                if (user.role === 'consultant') {
                  const timesheetsResult = await query(
                    env,
                    "SELECT COUNT(*) as count FROM timesheets WHERE user_id = ? AND status = 'draft'",
                    [user.id]
                  );
                  currentValue = parseInt(timesheetsResult[0]?.count || 0);
                }
                break;

              case 'total_users':
                if (user.role === 'admin') {
                  const usersResult = await query(
                    env,
                    'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
                  );
                  currentValue = parseInt(usersResult[0]?.count || 0);
                }
                break;

              case 'total_candidates':
                const candidatesResult = await query(
                  env,
                  "SELECT COUNT(*) as count FROM users WHERE role = 'candidate' AND is_active = 1"
                );
                currentValue = parseInt(candidatesResult[0]?.count || 0);
                break;

              default:
                currentValue = null;
            }
          } catch (error) {
            console.error(`Error calculating KPI value for ${kpi.metric_type}:`, error);
            currentValue = null;
          }

          return {
            ...kpi,
            current_value: currentValue
          };
        })
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify(kpisWithValues),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Create KPI
  if (path === '/api/kpis' && method === 'POST') {
    try {
      const body = await request.json();
      const { name, description, metric_type, display_order } = body;

      if (!name || !metric_type) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Name and metric_type are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      const result = await execute(
        env,
        `INSERT INTO kpis (user_id, name, description, metric_type, display_order)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, name, description || '', metric_type, display_order || 0]
      );

      const kpiId = result.meta?.last_row_id || result.lastInsertRowid;
      const newKpi = await queryOne(
        env,
        'SELECT * FROM kpis WHERE id = ?',
        [kpiId]
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify(newKpi),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error creating KPI:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Update KPI
  const updateMatch = path.match(/^\/api\/kpis\/(\d+)$/);
  if (updateMatch && method === 'PUT') {
    const kpiId = updateMatch[1];
    try {
      // Verify KPI belongs to user
      const existingKpi = await queryOne(
        env,
        'SELECT * FROM kpis WHERE id = ? AND user_id = ?',
        [kpiId, user.id]
      );

      if (!existingKpi) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'KPI not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      const body = await request.json();
      const { name, description, metric_type, display_order, is_active } = body;

      await execute(
        env,
        `UPDATE kpis SET name = ?, description = ?, metric_type = ?, display_order = ?, 
         is_active = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          name,
          description || '',
          metric_type,
          display_order || 0,
          is_active !== undefined ? (is_active ? 1 : 0) : existingKpi.is_active,
          kpiId
        ]
      );

      const updatedKpi = await queryOne(
        env,
        'SELECT * FROM kpis WHERE id = ?',
        [kpiId]
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify(updatedKpi),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error updating KPI:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Delete KPI
  const deleteMatch = path.match(/^\/api\/kpis\/(\d+)$/);
  if (deleteMatch && method === 'DELETE') {
    const kpiId = deleteMatch[1];
    try {
      // Verify KPI belongs to user
      const existingKpi = await queryOne(
        env,
        'SELECT * FROM kpis WHERE id = ? AND user_id = ?',
        [kpiId, user.id]
      );

      if (!existingKpi) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'KPI not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      await execute(
        env,
        'DELETE FROM kpis WHERE id = ?',
        [kpiId]
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify({ message: 'KPI deleted successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error deleting KPI:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Not found
  return addCorsHeaders(
    new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    ),
    env,
    request
  );
}
