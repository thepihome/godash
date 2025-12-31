/**
 * Migration script to add job_classification column to jobs table
 * Run this if your database already exists
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Running migration: Add job_classification to jobs table\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'job_hunting_db',
  });

  try {
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'job_classification'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Column job_classification already exists in jobs table');
      console.log('   No migration needed.\n');
      await pool.end();
      return;
    }

    // Add the column
    console.log('📝 Adding job_classification column to jobs table...');
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN job_classification INTEGER REFERENCES job_roles(id)
    `);

    console.log('✅ Migration completed successfully!\n');
    console.log('   The job_classification column has been added to the jobs table.');
    console.log('   You can now use job classification for matching candidates to jobs.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your database credentials in .env file');
    console.error('3. Make sure the job_roles table exists');
    console.error('4. Make sure you have ALTER TABLE permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if running directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

