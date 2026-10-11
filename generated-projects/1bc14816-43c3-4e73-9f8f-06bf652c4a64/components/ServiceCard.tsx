import type { LucideIcon } from "lucide-react";

export function ServiceCard({
  icon: Icon,
  title,
  description,
  status = "online",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "online" | "warn" | "alarm";
}) {
  const statusColor =
    status === "online" ? "text-online" : status === "warn" ? "text-warn" : "text-alarm";
  return (
    <article className="panel p-5 status-edge flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-cyan-400" />
        <span className={`text-[10px] font-mono uppercase ${statusColor}`}>{status}</span>
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{description}</p>
    </article>
  );
}
