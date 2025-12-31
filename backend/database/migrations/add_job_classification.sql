-- Migration: Add job_classification to jobs table
-- Run this migration if your database already exists

-- For PostgreSQL
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_classification INTEGER REFERENCES job_roles(id);

-- For D1 (SQLite) - run this if using Cloudflare D1
-- ALTER TABLE jobs ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);

