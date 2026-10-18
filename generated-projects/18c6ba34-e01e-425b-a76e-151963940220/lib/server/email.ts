import 'server-only';
import { Resend } from 'resend';
import { z } from 'zod';
import { env } from './env';

const resend = new Resend(env.RESEND_API_KEY);

const recipientSchema = z.string().email();

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: 'invalid_recipient' | 'send_failed' };

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<EmailResult> {
  const parsed = recipientSchema.safeParse(params.to);
  if (!parsed.success) {
    return { ok: false, error: 'invalid_recipient' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      headers: {
        'Idempotency-Key': params.idempotencyKey,
      },
    });

    if (error) {
      return { ok: false, error: 'send_failed' };
    }

    return { ok: true, id: data?.id ?? '' };
  } catch {
    return { ok: false, error: 'send_failed' };
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<EmailResult> {
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    idempotencyKey: `reset-${to}-${Date.now()}`,
  });
}
