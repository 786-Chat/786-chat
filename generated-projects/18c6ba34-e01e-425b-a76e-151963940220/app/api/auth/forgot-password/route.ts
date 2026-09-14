import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { createPasswordResetToken } from '@/lib/server/auth';
import { sendPasswordResetEmail } from '@/lib/server/email';

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;
    const db = getDb();

    // Always return 200 to avoid user enumeration
    const userResult = await db`SELECT id FROM users WHERE email = ${email}`;

    if (userResult.length === 0) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const userId = userResult[0].id as string;
    const token = await createPasswordResetToken(userId);
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
