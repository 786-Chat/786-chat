import { Activity, Wifi, RefreshCw } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-cyan-500/20 bg-navy-900/80 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <span>© {new Date().getFullYear()} 786 Journey Coffee</span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1 text-online"><Wifi className="h-3 w-3" /> GATEWAY OK</span>
          <span className="inline-flex items-center gap-1 text-cyan-300"><Activity className="h-3 w-3" /> MQTT SYNCED</span>
          <span className="inline-flex items-center gap-1 text-slate-400"><RefreshCw className="h-3 w-3" /> FLEET 12/12</span>
        </div>
      </div>
    </footer>
  );
}
