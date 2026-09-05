import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const embeddedPreview = process.env.VERCEL_ENV === 'preview';
  cookieStore.set('session', '', {
    httpOnly: true,
    sameSite: embeddedPreview ? 'none' : 'lax',
    secure: embeddedPreview || process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  return NextResponse.json({ ok: true });
}
