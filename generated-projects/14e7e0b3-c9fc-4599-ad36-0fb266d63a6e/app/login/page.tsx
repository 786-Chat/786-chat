import { Suspense } from 'react';
import LoginForm from './login-form';

export const metadata = {
  title: 'Login | Manufacturing Ops',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-100">Sign in to Manufacturing Ops</h1>
        <Suspense fallback={<div className="text-center text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
