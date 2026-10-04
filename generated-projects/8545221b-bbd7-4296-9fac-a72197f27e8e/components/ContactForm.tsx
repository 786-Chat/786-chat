"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Errors = { name?: string; email?: string; message?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (!values.name.trim()) next.name = "Please enter your name.";
    if (!emailPattern.test(values.email.trim())) next.email = "Please enter a valid email address.";
    if (values.message.trim().length < 10) next.message = "Please share at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-3xl bg-mist p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Message received</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Thanks, {values.name.split(" ")[0] || "friend"}.</h3>
        <p className="mt-3 max-w-prose text-sm text-graphite/60">
          We&apos;ll reply to {values.email} within one business day. In the meantime, come say hello at the roastery.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setValues({ name: "", email: "", message: "" });
          }}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:opacity-80"
        >
          Send another message <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          id="name"
          label="Name"
          value={values.name}
          onChange={update("name")}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={values.message}
          onChange={update("message")}
          className="mt-3 w-full resize-none border-0 border-b border-black/15 bg-transparent pb-3 text-base outline-none transition-colors focus:border-accent"
          placeholder="Tell us what you're brewing."
        />
        {errors.message ? <p className="mt-2 text-xs text-red-600">{errors.message}</p> : null}
      </div>
      <button
        type="submit"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Send message <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="mt-3 w-full border-0 border-b border-black/15 bg-transparent pb-3 text-base outline-none transition-colors focus:border-accent"
      />
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
