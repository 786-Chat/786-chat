"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const products = ["Malai Kulfi", "Mango Kulfi", "Pista Kulfi"];

const fields = [
  { key: "date", label: "Date", type: "date" },
  { key: "batchNumber", label: "Batch Number", type: "text" },
  { key: "product", label: "Product", type: "select", options: products },
  { key: "flavour", label: "Flavour", type: "text" },
  { key: "ingredients", label: "Ingredients", type: "textarea" },
  { key: "quantityMade", label: "Quantity Made", type: "number" },
  { key: "unit", label: "Unit", type: "text" },
  { key: "mixingStartTime", label: "Mixing Start Time", type: "time" },
  { key: "heatTreatmentTemperature", label: "Heat Treatment Temperature", type: "number" },
  { key: "heatTreatmentTime", label: "Heat Treatment Time", type: "time" },
  { key: "coolingStartTemperature", label: "Cooling Start Temperature", type: "number" },
  { key: "coolingStartTime", label: "Cooling Start Time", type: "time" },
  { key: "coolingFinalTemperature", label: "Cooling Final Temperature", type: "number" },
  { key: "coolingFinalTime", label: "Cooling Final Time", type: "time" },
];

export function ProductionView() {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Production</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide">
            Daily Kulfi Production Sheet
          </h2>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      className="h-11 w-full rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    >
                      <option value="">Select product</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="w-full rounded border-2 border-slate-400 bg-white px-3 py-2 text-base focus:border-sky-500 focus:outline-none"
                      rows={3}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="h-11 w-full rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="h-11 rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
              >
                Save Draft
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
