import 'server-only';
import { Resend } from 'resend';
import { getEnv } from './env';

export type EmailResult = { ok: boolean; error?: string };

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
  try {
    const env = getEnv();
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return { ok: false, error: 'Email service is not configured' };
    }
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
  const env = getEnv();
  const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    idempotencyKey: `reset-${email}-${token}`,
  });
}
