"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  createdAt: string;
}

export function ProcessFlowDetailView({ id }: { id: string }) {
  const [flow, setFlow] = useState<ProcessFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/process-flows/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setFlow(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!flow) return <p className="text-sm text-slate-400">Not found</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{flow.name}</h1>
      <p className="text-sm text-slate-400">{flow.description}</p>
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-lg font-bold">Steps</h2>
          <ol className="space-y-2">
            {flow.steps.map((step, index) => (
              <li key={index} className="flex items-center gap-2">
                <Badge tone="blue">{index + 1}</Badge>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}