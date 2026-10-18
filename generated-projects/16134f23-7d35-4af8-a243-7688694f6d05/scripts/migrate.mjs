import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = neon(databaseUrl);
const migration = readFileSync(new URL('../sql/migrations/001_initial.sql', import.meta.url), 'utf8');

async function runMigration() {
  console.log('Running migration: 001_initial.sql...');
  await sql(migration);
  console.log('Migration completed successfully!');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
