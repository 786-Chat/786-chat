import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ActionTray() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-500/20 p-8 backdrop-blur-xl sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          You are confirmed in 786.Chat.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">
          Return to the confirmation surface or continue with your next instruction.
        </p>
        <div className="mt-6">
          <Button href="/">
            Return to confirmation
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
