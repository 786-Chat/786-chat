import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);
const migration = readFileSync(join(process.cwd(), 'sql/migrations/001_initial.sql'), 'utf8');

try {
  await sql(migration);
  console.log('Migration applied successfully');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}