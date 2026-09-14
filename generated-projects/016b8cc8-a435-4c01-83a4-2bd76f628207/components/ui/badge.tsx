import { cn } from "@/lib/utils";

const tones = {
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  blue: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

export function Badge({ tone = "blue", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
