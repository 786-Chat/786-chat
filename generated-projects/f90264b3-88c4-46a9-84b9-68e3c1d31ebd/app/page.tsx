import { ConfirmationHero } from "@/components/ConfirmationHero";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <ConfirmationHero />
      <footer className="border-t border-indigo/10 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-semibold text-ink">786.Chat</p>
          <p>Single-route confirmation workspace.</p>
        </div>
      </footer>
    </main>
  );
}
