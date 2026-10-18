import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync(new URL('../sql/migrations/001_initial.sql', import.meta.url), 'utf8');
await sql(migration);
console.log('Migration applied');
