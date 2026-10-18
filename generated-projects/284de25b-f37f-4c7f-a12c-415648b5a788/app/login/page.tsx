import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-slate-900">Sign in to NorthStar Logistics</h1>
        <Suspense fallback={<div className="text-center text-slate-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
