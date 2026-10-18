import "server-only";
import { Resend } from "resend";
import { z } from "zod";
import { env } from "./env";

const resendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  idempotencyKey: z.string().min(1).max(200),
});

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: "invalid_input" | "provider_error" };

export async function sendEmail(input: z.infer<typeof resendSchema>): Promise<EmailResult> {
  const parsed = resendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { to, subject, html, idempotencyKey } = parsed.data;

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    if (error || !data?.id) {
      return { ok: false, error: "provider_error" };
    }

    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "provider_error" };
  }
}
