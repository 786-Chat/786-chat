"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const products = ["Malai Kulfi", "Mango Kulfi", "Pista Kulfi"];
const flavours = ["Malai", "Mango", "Pista"];
const units = ["Pieces", "Boxes", "Trays", "Litres"];
const packagingTypes = ["Box", "Tray", "Wrapper", "Jar", "Other"];
const freezerNumbers = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4"];

const fields = [
  { key: "date", label: "Date", type: "date" },
  { key: "batchNumber", label: "Batch Number", type: "text" },
  { key: "product", label: "Product", type: "select", options: products },
  { key: "flavour", label: "Flavour", type: "select", options: flavours },
  { key: "ingredients", label: "Ingredients", type: "textarea" },
  { key: "quantityMade", label: "Quantity Made", type: "number" },
  { key: "unit", label: "Unit", type: "select", options: units },
  { key: "mixingStartTime", label: "Mixing Start Time", type: "time" },
  { key: "heatTreatmentTemperature", label: "Heat Treatment Temperature (°C)", type: "number" },
  { key: "heatTreatmentTime", label: "Heat Treatment Time", type: "time" },
  { key: "coolingStartTemperature", label: "Cooling Start Temperature (°C)", type: "number" },
  { key: "coolingStartTime", label: "Cooling Start Time", type: "time" },
  { key: "coolingFinalTemperature", label: "Cooling Final Temperature (°C)", type: "number" },
  { key: "coolingFinalTime", label: "Cooling Final Time", type: "time" },
  { key: "packagingType", label: "Packaging Type", type: "select", options: packagingTypes },
  { key: "freezerNumber", label: "Freezer Number", type: "select", options: freezerNumbers },
  { key: "freezerInDate", label: "Freezer In Date", type: "date" },
  { key: "freezerInTime", label: "Freezer In Time", type: "time" },
];

const KULFI_INGREDIENTS =
  "Kulfi, a traditional frozen dessert made with condensed milk, nuts, and exotic spices. A tantalizing treat that's perfect for any occasion.";

export function ProductionView() {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("raja-catering-production-draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            return { ...parsed };
          }
        } catch {
          // ignore malformed draft
        }
      }
    }
    return {};
  });
  const [labelOk, setLabelOk] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("raja-catering-production-draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && typeof parsed.labelOk === "string") {
            return parsed.labelOk;
          }
        } catch {
          // ignore malformed draft
        }
      }
    }
    return "";
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleProductChange = (value: string) => {
    const updates: Record<string, string> = { product: value };
    if (value.toLowerCase().includes("kulfi")) {
      updates.ingredients = KULFI_INGREDIENTS;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveDraft = () => {
    const draft = { ...formData, labelOk };
    localStorage.setItem("raja-catering-production-draft", JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                      className="h-11 w-full cursor-pointer rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                      value={formData[field.key] || ""}
                      onChange={(e) =>
                        field.key === "product"
                          ? handleProductChange(e.target.value)
                          : handleChange(field.key, e.target.value)
                      }
                    >
                      <option value="">Select option</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 py-2 text-base focus:border-sky-500 focus:outline-none"
                      rows={3}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {/* Label OK? with YES/NO buttons */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Label OK?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLabelOk("YES")}
                    className={`h-12 flex-1 cursor-pointer rounded border-2 text-base font-bold transition-colors ${
                      labelOk === "YES"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-400 bg-white text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelOk("NO")}
                    className={`h-12 flex-1 cursor-pointer rounded border-2 text-base font-bold transition-colors ${
                      labelOk === "NO"
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-slate-400 bg-white text-slate-700 hover:bg-red-50"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* Freezer Temperature with °C suffix and minus sign on focus */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Freezer Temperature</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                    value={formData.freezerTemperature || ""}
                    onChange={(e) => handleChange("freezerTemperature", e.target.value)}
                    onFocus={(e) => {
                      if (!e.target.value) {
                        e.target.value = "-";
                        handleChange("freezerTemperature", "-");
                      }
                    }}
                  />
                  <span className="text-base font-semibold">°C</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && <span className="text-sm font-semibold text-emerald-600">Draft saved</span>}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-11 cursor-pointer rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
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
