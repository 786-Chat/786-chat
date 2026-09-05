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
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { ok: false, error: 'Email not configured' };
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function runtimeOrigin(explicitOrigin?: string): string {
  if (explicitOrigin) return explicitOrigin.replace(/\/$/, '');
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`;
  return getEnv().APP_URL.replace(/\/$/, '');
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  origin?: string,
): Promise<EmailResult> {
  const resetUrl = `${runtimeOrigin(origin)}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. If you didn't request this, ignore this email.</p>`;
  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
    idempotencyKey: `reset-${email}-${token}`,
  });
}
