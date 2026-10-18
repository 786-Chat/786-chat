import { Suspense } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;ve sent a verification link to your inbox. Click the link to activate your account.
        </p>
        <div className="mt-6 rounded-md bg-slate-800 p-4 text-sm text-slate-300">
          <p>Didn&apos;t receive the email? Check your spam folder or request a new link.</p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Back to login
          </Link>
          <Link
            href="/login?mode=register"
            className="inline-flex justify-center rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Register again
          </Link>
        </div>
      </div>
    </main>
  );
}
