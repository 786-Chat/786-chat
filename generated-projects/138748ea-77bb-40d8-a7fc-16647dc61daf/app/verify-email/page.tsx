'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const status = searchParams.get('status') || '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Email Verification</h1>
        <p className="mt-2 text-sm text-slate-600">
          {status === 'success'
            ? 'Your email has been verified. You can now sign in.'
            : status === 'error'
              ? 'Verification failed. The link may be invalid or expired.'
              : token
                ? 'Verifying your email...'
                : 'No verification token provided.'}
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Go to Dashboard
          </a>
          {status !== 'success' && (
            <a
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Resend Verification
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
