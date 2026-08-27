"use client";

import { useState, useEffect } from "react";

type ProcessFlow = {
  id: string;
  name: string;
  description: string;
  steps: string[];
};

export default function ProcessFlowPage() {
  const [flows, setFlows] = useState<ProcessFlow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/process-flows")
      .then((res) => res.json())
      .then((data) => setFlows(data))
      .catch(() => setMessage("Failed to load process flows"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filteredSteps = steps.filter((s) => s.trim() !== "");
    if (filteredSteps.length === 0) {
      setMessage("Add at least one step");
      return;
    }
    const res = await fetch("/api/process-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, steps: filteredSteps }),
    });
    if (res.ok) {
      const newFlow = await res.json();
      setFlows([...flows, newFlow]);
      setName("");
      setDescription("");
      setSteps([""]);
      setMessage("Process flow created");
    } else {
      setMessage("Failed to create process flow");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Process Flows</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Flow name"
          required
          className="h-11 w-full rounded border border-slate-600 bg-slate-950 px-3"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
        />
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={step}
              onChange={(e) => {
                const newSteps = [...steps];
                newSteps[index] = e.target.value;
                setSteps(newSteps);
              }}
              placeholder={`Step ${index + 1}`}
              className="h-11 w-full rounded border border-slate-600 bg-slate-950 px-3"
            />
            <button
              type="button"
              onClick={() => setSteps(steps.filter((_, i) => i !== index))}
              className="rounded bg-red-600 px-3 text-white"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps([...steps, ""])}
          className="rounded bg-slate-700 px-3 py-2 text-white"
        >
          Add Step
        </button>
        <button type="submit" className="block w-full rounded bg-emerald-600 py-2 font-semibold text-white">
          Create Flow
        </button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </form>
      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold">{flow.name}</h2>
            <p className="text-sm text-slate-400">{flow.description}</p>
            <ol className="mt-2 list-inside list-decimal text-sm">
              {flow.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
