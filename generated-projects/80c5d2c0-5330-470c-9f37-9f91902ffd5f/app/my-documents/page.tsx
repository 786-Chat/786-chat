"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

interface MyDocument {
  id: string;
  document_type: string;
  title: string;
  check_date: string;
  day_name: string;
  data: any;
}

export default function MyDocumentsPage() {
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [selected, setSelected] = useState<MyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-documents")
      .then(res => res.json())
      .then(data => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
        <button onClick={() => setSelected(null)} className="mb-4 flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-2">{selected.title}</h1>
        <p className="text-slate-400 mb-4">{selected.day_name} {formatDate(selected.check_date)}</p>
        <div className="space-y-2">
          {selected.data.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
              <span className="text-sm">{item.taskKey}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-slate-300 hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-4">My Documents</h1>
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-slate-400">No documents yet. Complete all Opening Checks for a day to archive it here.</p>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelected(doc)}
              className="w-full text-left rounded-xl bg-slate-800 p-4 hover:bg-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{doc.title}</p>
                  <p className="text-sm text-slate-400">{doc.day_name} {formatDate(doc.check_date)}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
