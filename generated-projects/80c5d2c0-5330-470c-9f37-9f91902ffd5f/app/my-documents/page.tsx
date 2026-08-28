"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

interface MyDocument {
  id: string;
  document_type: string;
  title: string;
  check_date: string;
  day_name: string;
  data: any;
}

function taskRows(doc: MyDocument) {
  return Array.isArray(doc.data) ? doc.data : [];
}

function isComplete(doc: MyDocument) {
  const rows = taskRows(doc);
  return rows.length === 9 && rows.every((item: any) => item?.completed === true);
}

export default function MyDocumentsPage() {
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [selected, setSelected] = useState<MyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-documents", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    const rows = taskRows(selected);
    const complete = isComplete(selected);

    return (
      <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
        <button onClick={() => setSelected(null)} className="mb-4 flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="mb-2 text-2xl font-bold">{selected.title}</h1>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-slate-400">{selected.day_name} {formatDate(selected.check_date)}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${complete ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"}`}>
            {complete ? "Completed" : "Incomplete"}
          </span>
        </div>
        <div className="space-y-2">
          {rows.map((item: any, idx: number) => {
            const checked = item?.completed === true;
            return (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 p-3">
                <span className="text-sm">{item.task || item.taskKey}</span>
                {checked ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-slate-300 hover:text-white">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>
      <h1 className="mb-4 text-2xl font-bold">My Documents</h1>
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : docs.length === 0 ? (
        <p className="text-slate-400">No Opening Check records yet.</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const complete = isComplete(doc);
            return (
              <button
                key={doc.id}
                onClick={() => setSelected(doc)}
                className="w-full rounded-xl bg-slate-800 p-4 text-left transition hover:bg-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{doc.title}</p>
                    <p className="text-sm text-slate-400">{doc.day_name} {formatDate(doc.check_date)}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-sm ${complete ? "text-emerald-400" : "text-amber-400"}`}>
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    {complete ? "Completed" : "Incomplete"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
