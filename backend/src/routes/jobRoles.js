/**
 * Job Roles routes for Cloudflare Workers
 */

import { query, queryOne, execute } from '../utils/db.js';
import { addCorsHeaders } from '../utils/cors.js';
import { authorize } from '../middleware/auth.js';

export async function handleJobRoles(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Get all job roles
  if (path === '/api/job-roles' && method === 'GET') {
    try {
      const { searchParams } = url;
      const includeInactive = searchParams.get('include_inactive') === 'true';
      
      let sql = 'SELECT * FROM job_roles';
      const params = [];
      
      if (!includeInactive) {
        sql += ' WHERE is_active = 1';
      }
      
      sql += ' ORDER BY created_at ASC';
      
      const roles = await query(env, sql, params);
      
      return addCorsHeaders(
        new Response(
          JSON.stringify(roles),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error fetching job roles:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Get single job role
  if (path.startsWith('/api/job-roles/') && method === 'GET') {
    const authCheck = authorize('admin')(user);
    if (authCheck) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: authCheck.error }),
          { status: authCheck.status || 403, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }

    try {
      const roleId = parseInt(path.split('/').pop());
      
      if (isNaN(roleId)) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Invalid role ID' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      const role = await queryOne(env, 'SELECT * FROM job_roles WHERE id = ?', [roleId]);
      
      if (!role) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Job role not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      return addCorsHeaders(
        new Response(
          JSON.stringify(role),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error fetching job role:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Create job role (admin only)
  if (path === '/api/job-roles' && method === 'POST') {
    const authCheck = authorize('admin')(user);
    if (authCheck) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: authCheck.error }),
          { status: authCheck.status || 403, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }

    try {
      const body = await request.json();
      const { name, description, is_active } = body;

      if (!name || !name.trim()) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      // Check if role with same name already exists
      const existing = await queryOne(
        env,
        'SELECT id FROM job_roles WHERE name = ?',
        [name.trim()]
      );

      if (existing) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Job role with this name already exists' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      const result = await execute(
        env,
        `INSERT INTO job_roles (name, description, is_active, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [
          name.trim(),
          description || null,
          is_active !== undefined ? (is_active ? 1 : 0) : 1
        ]
      );

      const newRole = await queryOne(
        env,
        'SELECT * FROM job_roles WHERE id = ?',
        [result.meta.last_row_id]
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify(newRole),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error creating job role:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Update job role (admin only)
  if (path.startsWith('/api/job-roles/') && method === 'PUT') {
    const authCheck = authorize('admin')(user);
    if (authCheck) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: authCheck.error }),
          { status: authCheck.status || 403, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }

    try {
      const roleId = parseInt(path.split('/').pop());
      const body = await request.json();
      const { name, description, is_active } = body;

      if (isNaN(roleId)) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Invalid role ID' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      // Check if role exists
      const existing = await queryOne(env, 'SELECT * FROM job_roles WHERE id = ?', [roleId]);
      if (!existing) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Job role not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      // Check if name is being changed and if new name already exists
      if (name && name.trim() !== existing.name) {
        const nameExists = await queryOne(
          env,
          'SELECT id FROM job_roles WHERE name = ? AND id != ?',
          [name.trim(), roleId]
        );

        if (nameExists) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ error: 'Job role with this name already exists' }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            ),
            env,
            request
          );
        }
      }

        await execute(
          env,
          `UPDATE job_roles 
         SET name = ?, description = ?, is_active = ?, updated_at = datetime('now')
         WHERE id = ?`,
          [
            name !== undefined ? name.trim() : existing.name,
            description !== undefined ? description : existing.description,
            is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
            roleId
          ]
        );

      const updatedRole = await queryOne(env, 'SELECT * FROM job_roles WHERE id = ?', [roleId]);

      return addCorsHeaders(
        new Response(
          JSON.stringify(updatedRole),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error updating job role:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  // Delete job role (admin only)
  if (path.startsWith('/api/job-roles/') && method === 'DELETE') {
    const authCheck = authorize('admin')(user);
    if (authCheck) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: authCheck.error }),
          { status: authCheck.status || 403, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }

    try {
      const roleId = parseInt(path.split('/').pop());

      if (isNaN(roleId)) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Invalid role ID' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      // Check if role exists
      const existing = await queryOne(env, 'SELECT * FROM job_roles WHERE id = ?', [roleId]);
      if (!existing) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ error: 'Job role not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          ),
          env,
          request
        );
      }

      // Soft delete by setting is_active to 0
      await execute(
        env,
        `UPDATE job_roles SET is_active = 0, updated_at = datetime('now') WHERE id = ?`,
        [roleId]
      );

      return addCorsHeaders(
        new Response(
          JSON.stringify({ message: 'Job role deleted successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    } catch (error) {
      console.error('Error deleting job role:', error);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Server error', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        env,
        request
      );
    }
  }

  return addCorsHeaders(
    new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    ),
    env,
    request
  );
}

