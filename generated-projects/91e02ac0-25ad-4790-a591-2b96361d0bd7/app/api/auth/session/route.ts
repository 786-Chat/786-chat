import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.company_id ?? null,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
