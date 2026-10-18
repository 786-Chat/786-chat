import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="glass animate-card-float rounded-3xl p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-glow">
          <Sparkles className="h-7 w-7 text-black" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-amber-200/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
