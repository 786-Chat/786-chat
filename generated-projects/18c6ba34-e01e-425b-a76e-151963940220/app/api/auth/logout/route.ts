import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { getSession } from '@/lib/server/auth';

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      const db = getDb();
      await db`DELETE FROM sessions WHERE id = ${session.id}`;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
