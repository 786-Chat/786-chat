import "server-only";
import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env";

export function getDb() {
  const env = getEnv();
  return neon(env.DATABASE_URL);
}
