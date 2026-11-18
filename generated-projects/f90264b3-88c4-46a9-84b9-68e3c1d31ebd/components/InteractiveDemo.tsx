"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const prompts = [
  "Confirm the workspace",
  "Summarise this project",
  "What route is live?"
];

export function InteractiveDemo() {
  const [active, setActive] = useState(0);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>(["786.Chat: Workspace confirmed."]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLog((prev) => [...prev, `You: ${trimmed}`, "786.Chat: Noted — operating in 786.Chat."]);
    setInput("");
  };

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Interactive demo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Try the confirmation surface.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Pick a prompt or type your own. This demo runs entirely in the browser and reflects the 786.Chat context.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setActive(index)}
                className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
                  active === index
                    ? "bg-white/20 text-white ring-1 ring-inset ring-cyan-300/50"
                    : "bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/10"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-slate-950/40 p-4 text-sm">
            {log.map((line, index) => (
              <p key={index} className={line.startsWith("You:") ? "text-cyan-200" : "text-slate-200"}>
                {line}
              </p>
            ))}
          </div>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(input || prompts[active]);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={prompts[active]}
              className="min-h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <button
              type="submit"
              aria-label="Send prompt"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
