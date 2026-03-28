-- Add a user manually (for Google Sign-In; user must exist in users table).
--
-- Run from backend folder:
--   wrangler d1 execute godashprodcore01 --file=./database/scripts/add-user-manual.sql
--
-- Or run locally:
--   wrangler d1 execute godashprodcore01 --local --file=./database/scripts/add-user-manual.sql
--
-- Edit the INSERT below: replace email (must match their Google account), first_name, last_name, role.

-- User (edit email, first_name, last_name, role as needed)
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, is_active)
VALUES (
  'user@example.com',         -- email: must match Google account
  'google_only',              -- unused for Google sign-in
  'First',
  'Last',
  'candidate',                -- 'candidate' | 'consultant' | 'admin'
  NULL,
  1
);

-- Candidate profile (only if role is 'candidate'; creates profile for the user we just inserted)
INSERT INTO candidate_profiles (user_id)
SELECT last_insert_rowid()
WHERE (SELECT role FROM users WHERE id = last_insert_rowid()) = 'candidate';
