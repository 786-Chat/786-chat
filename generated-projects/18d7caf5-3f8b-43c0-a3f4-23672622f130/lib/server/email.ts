import "server-only";
import { Resend } from "resend";
import { getEnv } from "./env";
import { z } from "zod";

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function sendEmail(input: z.infer<typeof emailSchema>) {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid email input" };
  }
  const env = getEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const idempotencyKey = crypto.randomUUID();
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: parsed.data.to,
      subject: parsed.data.subject,
      html: parsed.data.html,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
