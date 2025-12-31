# Database Migration Guide

## Migration: Add job_classification to jobs table

### Overview
This migration adds a `job_classification` column to the `jobs` table to enable job classification-based matching with candidates.

### When to Run
- ✅ **Run this migration** if your database already exists and was created before this update
- ❌ **Skip this migration** if you're setting up a new database (the schema.sql already includes this column)

### Quick Migration (Recommended)

#### For PostgreSQL (Express Backend)
```bash
cd backend
npm run migrate:job-classification
```

Or manually:
```bash
cd backend
node migrate-add-job-classification.js
```

#### For D1 (Cloudflare Workers)
```bash
# Using Wrangler CLI
wrangler d1 execute YOUR_DATABASE_NAME --command="ALTER TABLE jobs ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);"
```

Or via Cloudflare Dashboard:
1. Go to Cloudflare Dashboard > Workers & Pages > D1
2. Select your database
3. Go to "Execute SQL" tab
4. Run: `ALTER TABLE jobs ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);`

### Manual SQL Migration

#### PostgreSQL
```sql
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS job_classification INTEGER REFERENCES job_roles(id);
```

#### D1 (SQLite)
```sql
ALTER TABLE jobs 
ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);
```

### Verification

After running the migration, verify the column was added:

#### PostgreSQL
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'job_classification';
```

#### D1 (SQLite)
```sql
PRAGMA table_info(jobs);
```

You should see `job_classification` as an INTEGER column that can be NULL.

### What This Enables

After this migration:
- ✅ Jobs can have a job classification (references job_roles table)
- ✅ Candidates can be automatically matched to jobs based on classification
- ✅ Job matching will use classification as the primary matching criteria
- ✅ Job list shows company first, then job title

### Rollback (if needed)

If you need to remove this column:

#### PostgreSQL
```sql
ALTER TABLE jobs DROP COLUMN IF EXISTS job_classification;
```

#### D1 (SQLite)
```sql
-- Note: SQLite doesn't support DROP COLUMN directly
-- You would need to recreate the table
```

### Notes

- The column is nullable, so existing jobs without classification will have NULL
- The column references `job_roles(id)`, so make sure the `job_roles` table exists
- If `job_roles` table doesn't exist, create it first using the schema.sql file

