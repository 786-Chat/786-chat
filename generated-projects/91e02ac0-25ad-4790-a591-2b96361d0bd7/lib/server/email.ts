import 'server-only';
import { Resend } from 'resend';
import { env } from './env';

export type EmailResult = { ok: boolean; id?: string; error?: string };

export async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<EmailResult> {
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    idempotencyKey: `reset-${email}-${token}`,
  });
}
