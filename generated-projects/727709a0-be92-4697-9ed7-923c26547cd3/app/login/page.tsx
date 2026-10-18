'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [done, setDone] = useState(false);
  return (
    <div className="fade-in py-16 px-4 max-w-md mx-auto">
      <h1 className="section-title">Login</h1>
      {done ? <p className="text-center text-green-400">Welcome back!</p> : (
        <form onSubmit={(e)=>{e.preventDefault(); setDone(true);}} className="space-y-4">
          <input required type="email" className="input" placeholder="Email" />
          <input required type="password" className="input" placeholder="Password" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-gold/80">
              <input type="checkbox" name="remember-me" className="accent-gold" />
              Remember me
            </label>
            <Link href="/login?mode=forgot" className="text-gold underline text-sm">Forgot password?</Link>
          </div>
          <button className="btn btn-gold w-full">Sign In</button>
          <p className="text-center text-gold/70">New here? <Link href="/login?mode=register" className="text-gold underline">Register</Link></p>
        </form>
      )}
    </div>
  );
}
