import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { getSession, destroySession } from '@/lib/server/auth';

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      const db = getDb();
      await db`DELETE FROM sessions WHERE user_id = ${session.userId}`;
    }

    await destroySession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
