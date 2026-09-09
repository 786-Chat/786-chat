import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const migration = readFileSync(join(process.cwd(), 'sql', 'migrations', '001_initial.sql'), 'utf8');

async function run() {
  try {
    await sql`${migration}`;
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
