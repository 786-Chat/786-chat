import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function getEnv(): ServerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid environment variables: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  return parsed.data;
}
