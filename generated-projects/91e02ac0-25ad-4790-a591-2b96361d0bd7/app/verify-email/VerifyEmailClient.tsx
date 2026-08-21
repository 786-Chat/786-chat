'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        setMessage('Your email has been verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <p className="text-slate-600">Verifying your email...</p>
      )}

      {status === 'success' && (
        <>
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
          <Link href="/login" className="btn btn-primary w-full">
            Continue to sign in
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {message}
          </div>
          <Link href="/login" className="btn btn-secondary w-full">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
