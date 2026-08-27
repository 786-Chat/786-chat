"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export function ProcessFlowNewView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || cleanSteps.length === 0) {
      setError("Name and at least one step are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/process-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, steps: cleanSteps }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save");
      }
      const data = await res.json();
      router.push(`/process-flow/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Process Flow</h1>
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Steps</label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <input key={index} value={step} onChange={(e) => updateStep(index, e.target.value)} placeholder={`Step ${index + 1}`} className="h-11 w-full rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                ))}
              </div>
              <button type="button" onClick={addStep} className="mt-2 rounded bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300">
                Add Step
              </button>
            </div>
            <button type="submit" disabled={saving} className="h-11 rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
              {saving ? "Saving..." : "Save Flow"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}