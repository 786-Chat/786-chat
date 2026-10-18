import 'server-only';
import { Resend } from 'resend';
import { env } from './env';
import { randomUUID } from 'crypto';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  const idempotencyKey = randomUUID();
  return resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}
