import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error('Invalid environment variables: ' + JSON.stringify(parsed.error.flatten().fieldErrors));
}

export const env = parsed.data;
