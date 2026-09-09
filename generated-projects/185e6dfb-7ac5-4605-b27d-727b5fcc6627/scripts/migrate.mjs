import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(url);
const migration = readFileSync(new URL('../sql/migrations/001_initial.sql', import.meta.url), 'utf8');

try {
  await sql(migration);
  console.log('Migration applied successfully');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
