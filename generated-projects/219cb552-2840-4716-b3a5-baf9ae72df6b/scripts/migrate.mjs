#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(__dirname, '../sql/migrations/001_initial.sql');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  try {
    const migration = await readFile(migrationPath, 'utf8');
    await sql.query(migration);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
