import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export function getServerEnv() {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

export function requireDatabaseUrl(): string {
  return getServerEnv().DATABASE_URL;
}

export function getEnv(name: 'DATABASE_URL'): string {
  if (name === 'DATABASE_URL') return requireDatabaseUrl();
  throw new Error(`Unsupported server environment variable: ${name}`);
}
