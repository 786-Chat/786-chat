"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { MobileBackButton } from "@/components/mobile-back-button";

interface MyDocument {
  id: string;
  document_type: string;
  title: string;
  check_date: string;
  day_name: string;
  data: any;
  status?: string;
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
        <MobileBackButton />
        <button onClick={() => setSelected(null)} className="mb-4 flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-2">{selected.title}</h1>
        <p className="text-slate-400 mb-4">{selected.day_name} {formatDate(selected.check_date)}</p>
        <div className="space-y-2">
          {selected.data.map((item: any, idx: number) => (
            <div key={idx} className="rounded-lg bg-slate-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{item.areaEquipment || item.task || item.taskKey}</span>
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded border-2 border-slate-500" />
                )}
              </div>
              {item.cleaningDate && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div><span className="font-semibold">Date:</span> {item.cleaningDate}</div>
                  <div><span className="font-semibold">Time:</span> {item.cleaningTime}</div>
                  <div><span className="font-semibold">Task:</span> {item.cleaningTask}</div>
                  <div><span className="font-semibold">Cleaned By:</span> {item.cleanedBy}</div>
                  <div><span className="font-semibold">Checked By:</span> {item.checkedBy}</div>
                  <div><span className="font-semibold">Chemical:</span> {item.chemicalUsed}</div>
                  <div><span className="font-semibold">Result:</span> {item.result}</div>
                  <div><span className="font-semibold">Completed:</span> {item.completed ? "Yes" : "No"}</div>
                  {item.notes && <div className="col-span-2"><span className="font-semibold">Notes:</span> {item.notes}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-400">Status: {selected.status || (selected.data.every((i: any) => i.completed) ? "Completed" : "Incomplete")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <MobileBackButton />
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
                  <CheckCircle2 className="h-4 w-4" /> {doc.status || (doc.data.every((i: any) => i.completed) ? "Completed" : "Incomplete")}
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
