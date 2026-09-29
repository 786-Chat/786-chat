import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server/auth';
import { sendEmail } from '@/lib/server/email';

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { to, subject, html } = parsed.data;
    await sendEmail(to, subject, html);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}
