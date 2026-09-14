'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    }

    verify();
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Email Verification</h1>
        {status === 'verifying' && (
          <p className="text-neutral-600">Verifying your email...</p>
        )}
        {status === 'success' && (
          <div>
            <p className="text-green-600 mb-4">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full text-center bg-neutral-900 text-white py-2 px-4 rounded-md hover:bg-neutral-800 transition"
            >
              Go to Login
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-600 mb-4">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full text-center bg-neutral-900 text-white py-2 px-4 rounded-md hover:bg-neutral-800 transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
