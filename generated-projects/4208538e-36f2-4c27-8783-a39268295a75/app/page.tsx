"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      setAnswer("Thanks for asking! I'm here to help.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Ask a Question</h1>
        <p className="mt-2 text-slate-600">
          Type your question below and we&apos;ll respond.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label htmlFor="question" className="block text-sm font-medium text-slate-700">
            Your question
          </label>
          <textarea
            id="question"
            name="question"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What would you like to know?"
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </form>
        {answer && (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
            {answer}
          </div>
        )}
      </div>
    </main>
  );
}
