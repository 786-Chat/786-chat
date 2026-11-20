import 'server-only';
import { neon, neonConfig } from '@neondatabase/serverless';
import { getEnv } from './env';

// Lazy Neon client factory. DATABASE_URL is read only when getDb/getSql is called.
let cachedSql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!cachedSql) {
    const { DATABASE_URL } = getEnv();
    neonConfig.fetchConnectionCache = true;
    cachedSql = neon(DATABASE_URL);
  }
  return cachedSql;
}

async function getDb() {
  return getSql();
}

export { getDb, getSql };
