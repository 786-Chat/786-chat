import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  throw new Error('Invalid environment variables: ' + JSON.stringify(parsedEnv.error.format()));
}

export const env = parsedEnv.data;
