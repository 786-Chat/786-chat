import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) {
  const { to, subject, html, idempotencyKey } = params;
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}
