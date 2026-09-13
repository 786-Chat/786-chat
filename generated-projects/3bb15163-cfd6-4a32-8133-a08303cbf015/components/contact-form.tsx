"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type Status = "idle" | "sent";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="border border-line bg-paper p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-status" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Message queued</p>
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight">Thanks, {name.split(" ")[0]}.</h3>
        <p className="mt-2 text-sm text-muted">
          We received your note and will reply to {email} within one business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="mt-6 inline-flex items-center gap-2 border border-ink bg-paper px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-paper p-6 sm:p-8" noValidate>
      <div className="grid gap-5">
        <div>
          <label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-muted">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full max-w-full border border-line bg-paper px-3 py-3 font-mono text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full max-w-full border border-line bg-paper px-3 py-3 font-mono text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="message" className="font-mono text-xs uppercase tracking-widest text-muted">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you need — wholesale, subscriptions or events."
            className="mt-2 w-full max-w-full resize-y border border-line bg-paper px-3 py-3 font-mono text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 sm:w-auto"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send message
        </button>
      </div>
    </form>
  );
}
