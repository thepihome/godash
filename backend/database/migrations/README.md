# Database Migrations

## Migration: Add job_classification to jobs table

### When to run
If your database already exists and you need to add the `job_classification` column to the `jobs` table.

### PostgreSQL Migration
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_classification INTEGER REFERENCES job_roles(id);
```

### D1 (SQLite) Migration
```sql
ALTER TABLE jobs ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);
```

### How to run

#### For PostgreSQL (Express backend)
```bash
cd backend
psql -U your_username -d your_database -f database/migrations/add_job_classification.sql
```

Or connect to your database and run:
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_classification INTEGER REFERENCES job_roles(id);
```

#### For D1 (Cloudflare Workers)
```bash
# Using Wrangler CLI
wrangler d1 execute YOUR_DATABASE_NAME --file=backend/database/migrations/add_job_classification.sql
```

Or using the D1 dashboard:
1. Go to Cloudflare Dashboard > Workers & Pages > D1
2. Select your database
3. Go to "Execute SQL" tab
4. Run: `ALTER TABLE jobs ADD COLUMN job_classification INTEGER REFERENCES job_roles(id);`

### Verification
After running the migration, verify the column was added:
```sql
-- PostgreSQL
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'job_classification';

-- D1 (SQLite)
PRAGMA table_info(jobs);
```

You should see `job_classification` as an INTEGER column.

