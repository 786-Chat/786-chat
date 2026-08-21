import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'sql', 'migrations', '001_initial.sql');
const sql = readFileSync(sqlPath, 'utf8');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sqlClient = neon(databaseUrl);

try {
  await sqlClient(sql);
  console.log('Migration applied successfully');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
