
import 'server-only';
import { createHash } from 'crypto';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

type ParsedEnv = z.infer<typeof envSchema>;
export type Env = Omit<ParsedEnv, 'AUTH_SECRET'> & { AUTH_SECRET: string };

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  const authSecret = parsed.data.AUTH_SECRET ?? createHash('sha256')
    .update(`786.chat-auth:${parsed.data.DATABASE_URL}`)
    .digest('hex');

  return { ...parsed.data, AUTH_SECRET: authSecret };
}

export const env = getEnv();
