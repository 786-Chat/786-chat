'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Register() {
  const [done, setDone] = useState(false);
  return (
    <div className="fade-in py-16 px-4 max-w-md mx-auto">
      <h1 className="section-title">Register</h1>
      {done ? <p className="text-center text-green-400">Account created!</p> : (
        <form onSubmit={(e)=>{e.preventDefault(); setDone(true);}} className="space-y-4">
          <input required className="input" placeholder="Full Name" />
          <input required type="email" className="input" placeholder="Email" />
          <input required type="password" className="input" placeholder="Password" />
          <button className="btn btn-gold w-full">Create Account</button>
          <p className="text-center text-gold/70">Have an account? <Link href="/login" className="text-gold underline">Login</Link></p>
        </form>
      )}
    </div>
  );
}
