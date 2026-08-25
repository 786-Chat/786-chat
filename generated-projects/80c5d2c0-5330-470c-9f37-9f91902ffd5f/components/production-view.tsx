"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const products = ["Malai Kulfi", "Mango Kulfi", "Pista Kulfi"];
const flavours = ["Malai", "Mango", "Pista"];
const units = ["Pieces", "Boxes", "Trays", "Litres"];
const packagingTypes = ["Box", "Tray", "Wrapper", "Jar", "Other"];
const freezerNumbers = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4"];
const storageInstructions = ["Keep Frozen", "Keep Refrigerated", "Store in a Cool Dry Place"];
const storageLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];

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
  { key: "useByDate", label: "Use By Date", type: "date" },
  { key: "storageInstruction", label: "Storage Instruction", type: "select", options: storageInstructions },
  { key: "storageLocation", label: "Storage Location", type: "select", options: storageLocations },
];

const KULFI_INGREDIENTS =
  "Kulfi, a traditional frozen dessert made with condensed milk, nuts, and exotic spices. A tantalizing treat that's perfect for any occasion.";

const requiredFields = [
  "date",
  "batchNumber",
  "product",
  "flavour",
  "ingredients",
  "quantityMade",
  "unit",
  "mixingStartTime",
  "heatTreatmentTemperature",
  "heatTreatmentTime",
  "coolingStartTemperature",
  "coolingStartTime",
  "coolingFinalTemperature",
  "coolingFinalTime",
  "packagingType",
  "freezerNumber",
  "freezerInDate",
  "freezerInTime",
  "useByDate",
  "storageInstruction",
  "storageLocation",
  "freezerTemperature",
];

// Barcode and QR generation helpers
function generateCode128(data: string): string {
  // Simplified Code 128 encoding for demonstration.
  // In production, use a proper barcode library.
  return `Code128:${data}`;
}

function generateQRCode(data: string): string {
  // Simplified QR code representation.
  // In production, use a proper QR library.
  return `QR:${data}`;
}

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
  const [savedRecord, setSavedRecord] = useState<Record<string, string> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [scanView, setScanView] = useState<Record<string, string> | null>(null);

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

  const handleSaveRecord = () => {
    const missing = requiredFields.filter((key) => !formData[key] || formData[key].trim() === "");
    if (!labelOk) missing.push("labelOk");
    if (missing.length > 0) {
      setValidationErrors(missing);
      return;
    }
    setValidationErrors([]);
    const record: Record<string, string> = { ...formData, labelOk };
    const batchRecordId = `RC-${Date.now().toString(36).toUpperCase()}`;
    record.batchRecordId = batchRecordId;
    setSavedRecord(record);
  };

  if (scanView) {
    const useByDate = scanView.useByDate ? new Date(scanView.useByDate) : null;
    const today = new Date();
    const isExpired = useByDate ? useByDate < today : false;
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Batch Scan</h1>
        <Card className="border-2 border-slate-600 bg-white text-slate-900">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Batch Details</h2>
              <Badge tone={isExpired ? "red" : "green"}>
                {isExpired ? "Expired" : "Within Use By Date"}
              </Badge>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Product</dt>
                <dd className="text-base font-medium">{scanView.product || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Flavour</dt>
                <dd className="text-base font-medium">{scanView.flavour || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Batch Number</dt>
                <dd className="text-base font-medium">{scanView.batchNumber || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Production Date</dt>
                <dd className="text-base font-medium">{scanView.date || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Use By Date</dt>
                <dd className="text-base font-medium">{scanView.useByDate || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Storage Instruction</dt>
                <dd className="text-base font-medium">{scanView.storageInstruction || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Storage Location</dt>
                <dd className="text-base font-medium">{scanView.storageLocation || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Required Freezer Temperature</dt>
                <dd className="text-base font-medium">
                  {scanView.freezerTemperature ? `${scanView.freezerTemperature} °C` : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setScanView(null)}
                className="h-11 cursor-pointer rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
              >
                Back to Record
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (savedRecord) {
    const barcode = generateCode128(savedRecord.batchRecordId || "");
    const qrCode = generateQRCode(savedRecord.batchRecordId || "");
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Production</h1>
        <Card className="border-2 border-slate-600 bg-white text-slate-900">
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide">
              Production Record Details
            </h2>
            <div className="mb-4 rounded border border-slate-300 bg-slate-50 p-3">
              <span className="text-sm font-semibold text-slate-500">Production Record ID: </span>
              <span className="text-base font-bold text-sky-700">{savedRecord.batchRecordId}</span>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col">
                  <dt className="text-sm font-semibold text-slate-500">{field.label}</dt>
                  <dd className="text-base font-medium text-slate-900">{savedRecord[field.key] || "—"}</dd>
                </div>
              ))}
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Label OK?</dt>
                <dd className="text-base font-medium text-slate-900">{savedRecord.labelOk || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Freezer Temperature</dt>
                <dd className="text-base font-medium text-slate-900">
                  {savedRecord.freezerTemperature ? `${savedRecord.freezerTemperature} °C` : "—"}
                </dd>
              </div>
            </dl>

            {/* Barcode and QR Code section */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-slate-300 bg-slate-50 p-4 text-center">
                <h3 className="mb-2 text-sm font-semibold text-slate-500">Code 128 Barcode</h3>
                <div className="font-mono text-xs text-slate-700">{barcode}</div>
              </div>
              <div className="rounded border border-slate-300 bg-slate-50 p-4 text-center">
                <h3 className="mb-2 text-sm font-semibold text-slate-500">QR Code</h3>
                <button
                  type="button"
                  onClick={() => setScanView(savedRecord)}
                  className="inline-flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                  <span className="font-mono text-xs">{qrCode}</span>
                  <span>Scan</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSavedRecord(null)}
                className="h-11 cursor-pointer rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
              >
                Back to Form
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

            {validationErrors.length > 0 && (
              <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Please complete the following required fields:</p>
                <ul className="mt-1 list-inside list-disc">
                  {validationErrors.map((key) => {
                    const field = fields.find((f) => f.key === key);
                    return <li key={key}>{field ? field.label : key === "labelOk" ? "Label OK?" : key}</li>;
                  })}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && <span className="text-sm font-semibold text-emerald-600">Draft saved</span>}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-11 cursor-pointer rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="h-11 cursor-pointer rounded bg-emerald-600 px-6 text-base font-semibold text-white hover:bg-emerald-500"
              >
                Save Record
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
