import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true
});

pool.on('error', (err: any) => {
  console.error('[DB] Pool error (non-fatal):', err.message || err);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to database');
});

export const db = drizzle(pool, { schema });
export { pool };
