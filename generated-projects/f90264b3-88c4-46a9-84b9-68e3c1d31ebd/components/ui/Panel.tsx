import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] bg-white/80 p-5 shadow-panel ring-1 ring-inset ring-indigo/10 backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}
