-- Seed permissions + role_permissions for D1 (SQLite).
-- Run once if GET /api/permissions returns [] or Settings → Permissions shows no toggles.
-- From repo backend/:
--   npx wrangler d1 execute godashprodcore01 --remote --file=./database/migrations/seed_permissions_d1.sql
-- Use --local and your local DB name for dev.

INSERT OR IGNORE INTO permissions (name, description, resource_type, action) VALUES
  ('tab_dashboard', 'Access Dashboard tab', 'tab', 'view'),
  ('tab_jobs', 'Access Jobs tab', 'tab', 'view'),
  ('tab_resumes', 'Access Resumes tab', 'tab', 'view'),
  ('tab_matches', 'Access Matches tab', 'tab', 'view'),
  ('tab_candidates', 'Access Candidates tab', 'tab', 'view'),
  ('tab_timesheets', 'Access Timesheets tab', 'tab', 'view'),
  ('tab_crm', 'Access CRM tab', 'tab', 'view'),
  ('tab_settings', 'Access Settings tab', 'tab', 'view'),
  ('tab_register', 'Access Register tab', 'tab', 'view'),
  ('tab_metadata', 'Access Metadata tab', 'tab', 'view'),
  ('job_view', 'View job listings', 'job', 'view'),
  ('job_create', 'Create new job postings', 'job', 'create'),
  ('job_edit', 'Edit job postings', 'job', 'edit'),
  ('job_delete', 'Delete job postings', 'job', 'delete'),
  ('user_view', 'View users', 'user', 'view'),
  ('user_create', 'Create users', 'user', 'create'),
  ('user_edit', 'Edit users', 'user', 'edit'),
  ('user_delete', 'Delete users', 'user', 'delete'),
  ('candidate_view', 'View candidate profiles', 'candidate', 'view'),
  ('candidate_create', 'Create candidate profiles', 'candidate', 'create'),
  ('candidate_edit', 'Edit candidate profiles', 'candidate', 'edit'),
  ('candidate_delete', 'Delete candidate profiles', 'candidate', 'delete'),
  ('candidate_assign', 'Assign candidates to consultants', 'candidate', 'assign'),
  ('timesheet_view', 'View timesheets', 'timesheet', 'view'),
  ('timesheet_create', 'Create timesheets', 'timesheet', 'create'),
  ('timesheet_approve', 'Approve timesheets', 'timesheet', 'approve'),
  ('group_manage', 'Manage user groups', 'group', 'manage'),
  ('kpi_manage', 'Manage KPIs', 'kpi', 'manage'),
  ('view_all_data', 'View all data across the platform', 'system', 'view');

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'consultant', id FROM permissions WHERE name IN (
  'tab_dashboard', 'tab_jobs', 'tab_matches', 'tab_candidates', 'tab_timesheets', 'tab_crm', 'tab_settings', 'tab_register',
  'job_view', 'job_create', 'job_edit', 'job_delete',
  'candidate_view', 'candidate_edit',
  'timesheet_view', 'timesheet_create',
  'kpi_manage'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'candidate', id FROM permissions WHERE name IN (
  'tab_dashboard', 'tab_jobs', 'tab_resumes', 'tab_matches', 'tab_settings',
  'job_view',
  'kpi_manage'
);
