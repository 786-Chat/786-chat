import { Suspense } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

async function verifyEmail(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const data = await res.json();
    return { ok: res.ok, error: data.error };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Invalid verification link</h1>
          <p className="mt-2 text-sm text-slate-600">The verification token is missing.</p>
          <Link href="/login" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const result = await verifyEmail(token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        {result.ok ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Email verified</h1>
            <p className="mt-2 text-sm text-slate-600">Your email has been verified. You can now log in.</p>
            <Link href="/login" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Verification failed</h1>
            <p className="mt-2 text-sm text-slate-600">{result.error || 'The token is invalid or expired.'}</p>
            <Link href="/login" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
