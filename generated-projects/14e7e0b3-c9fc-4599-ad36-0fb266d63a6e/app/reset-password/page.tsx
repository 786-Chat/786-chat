import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = {
  title: 'Reset Password | Manufacturing Ops',
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Reset Password</h1>
        <p className="mb-6 text-sm text-slate-400">
          Enter your new password below.
        </p>
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
