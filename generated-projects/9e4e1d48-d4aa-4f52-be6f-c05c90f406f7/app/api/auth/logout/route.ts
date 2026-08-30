import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/server/auth';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (token) {
    await deleteSession(token);
    cookieStore.delete('session');
  }
  return NextResponse.json({ success: true });
}
