"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  createdAt: string;
}

export function ProcessFlowView() {
  const [flows, setFlows] = useState<ProcessFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/process-flows")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setFlows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Process Flow</h1>
        <Link href="/process-flow/new" className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          New Flow
        </Link>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : flows.length === 0 ? (
        <p className="text-sm text-slate-400">No process flows yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id}>
              <CardContent className="p-4">
                <h2 className="font-semibold">{flow.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{flow.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {flow.steps.map((step) => (
                    <Badge key={step} tone="blue">{step}</Badge>
                  ))}
                </div>
                <Link href={`/process-flow/${flow.id}`} className="mt-4 inline-block text-sm font-semibold text-sky-400">
                  View
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}