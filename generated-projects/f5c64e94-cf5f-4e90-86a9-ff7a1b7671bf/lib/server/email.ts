import 'server-only';
import { Resend } from 'resend';
import { getEnv } from './env';

type SendEmailResult = { ok: boolean; id?: string; error?: string };

let cachedResend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!cachedResend) {
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

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
}): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: 'Email service not configured' };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: getEnv().EMAIL_FROM,
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

export async function sendPasswordResetEmail(email: string, token: string): Promise<SendEmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Reset your Bean House password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    idempotencyKey: `reset-${email}-${token}`,
  });
}

export async function sendWelcomeEmail(email: string): Promise<SendEmailResult> {
  return sendEmail({
    to: email,
    subject: 'Welcome to Bean House',
    html: '<p>Welcome to Bean House! Your account has been created.</p>',
    idempotencyKey: `welcome-${email}`,
  });
}

export async function sendVerificationEmail(email: string, token: string): Promise<SendEmailResult> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
    idempotencyKey: `verify-${email}-${token}`,
  });
}
