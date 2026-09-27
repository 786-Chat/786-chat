"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setMessage("Email verified successfully!");
      } else {
        const data = await res.json();
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-800 rounded-lg shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Verify Email</h1>
      <p className="mb-4">Click the button below to verify your email address.</p>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
      <button
        onClick={handleVerify}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium"
      >
        Verify Email
      </button>
    </div>
  );
}
