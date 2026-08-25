import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required")
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Invalid environment variables: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  return parsed.data;
}
