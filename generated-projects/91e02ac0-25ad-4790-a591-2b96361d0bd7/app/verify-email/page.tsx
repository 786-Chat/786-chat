import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const metadata = {
  title: 'Verify Email',
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Verify your email</h1>
        <Suspense fallback={<p className="text-slate-600">Loading...</p>}>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </main>
  );
}
