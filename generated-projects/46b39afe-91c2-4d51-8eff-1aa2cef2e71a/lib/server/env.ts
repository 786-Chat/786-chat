import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

export function getEnv(name: keyof typeof envSchema.shape): string {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data[name];
}

export function getDatabaseUrl(): string {
  return getEnv('DATABASE_URL');
}
