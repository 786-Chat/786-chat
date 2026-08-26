import "server-only";
import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env";

// DATABASE_URL is loaded lazily inside getDb to avoid build-time connection.
export function getDb() {
  const env = getEnv();
  return neon(env.DATABASE_URL);
}
