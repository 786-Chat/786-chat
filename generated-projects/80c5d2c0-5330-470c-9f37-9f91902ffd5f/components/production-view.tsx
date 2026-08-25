"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import bwipjs from "bwip-js";
import QRCode from "qrcode";

const products = ["Malai Kulfi", "Mango Kulfi", "Pista Kulfi"];
const flavours = ["Malai", "Mango", "Pista"];
const units = ["Pieces", "Boxes", "Trays", "Litres"];
const packagingTypes = ["Box", "Tray", "Wrapper", "Jar", "Other"];
const storageLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];
const storageInstructions = ["Keep Frozen", "Keep Refrigerated", "Store in a Cool Dry Place"];

const KULFI_INGREDIENTS = "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts";
const KULFI_ALLERGENS = "Milk, Nuts";
const KULFI_NET_WEIGHT = "85 g";

const fields = [
  { key: "date", label: "Production Date", type: "date" },
  { key: "batchNumber", label: "Batch Number", type: "text" },
  { key: "product", label: "Product", type: "select", options: products },
  { key: "flavour", label: "Flavour", type: "select", options: flavours },
  { key: "ingredients", label: "Ingredients", type: "textarea" },
  { key: "allergens", label: "Allergens", type: "textarea" },
  { key: "quantityMade", label: "Quantity Made", type: "number" },
  { key: "unit", label: "Unit", type: "select", options: units },
  { key: "mixingStartTime", label: "Mixing Start Time", type: "time" },
  { key: "heatTreatmentTemperature", label: "Heat Treatment Temperature (°C)", type: "number" },
  { key: "heatTreatmentTime", label: "Heat Treatment Time", type: "time" },
  { key: "coolingStartTime", label: "Cooling Start Time", type: "time" },
  { key: "coolingStartTemperature", label: "Cooling Start Temperature (°C)", type: "number" },
  { key: "coolingFinalTime", label: "Cooling Final Time", type: "time" },
  { key: "coolingFinalTemperature", label: "Cooling Final Temperature (°C)", type: "number" },
  { key: "packagingType", label: "Packaging Type", type: "select", options: packagingTypes },
  { key: "storageLocation", label: "Storage Location", type: "select", options: storageLocations },
  { key: "storageInDate", label: "Storage In Date", type: "date" },
  { key: "storageInTime", label: "Storage In Time", type: "time" },
  { key: "useByDate", label: "Use By Date", type: "date" },
  { key: "storageInstruction", label: "Storage Instruction", type: "select", options: storageInstructions },
  { key: "netWeight", label: "Net Weight", type: "text" },
  { key: "operatorName", label: "Operator Name / Initials", type: "text" }
];

const requiredFields = [
  "date", "batchNumber", "product", "flavour", "ingredients", "allergens", "quantityMade", "unit",
  "mixingStartTime", "heatTreatmentTemperature", "heatTreatmentTime", "coolingStartTime",
  "coolingStartTemperature", "coolingFinalTime", "coolingFinalTemperature", "packagingType",
  "storageLocation", "storageInDate", "storageInTime", "useByDate", "storageInstruction",
  "storageTemperature", "netWeight", "operatorName"
];

function formatTemperature(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return `${num}°C`;
}

function getStorageTemperatureError(instruction: string, value: string): string | null {
  if (!instruction || !value || value.trim() === "") return null;
  const num = parseFloat(value);
  if (isNaN(num)) return "Storage Temperature must be a number.";
  if (instruction === "Keep Frozen") {
    if (num >= 0) return "Enter the freezer temperature as a negative value, for example -18°C.";
    if (num > -18) return "Storage Temperature should be -18°C or colder for frozen storage.";
  } else if (instruction === "Keep Refrigerated") {
    if (num < 0 || num > 8) return "Storage Temperature must be between 0°C and 8°C for refrigerated storage.";
    if (num > 5) return "Recommended target is 5°C or below for refrigerated storage.";
  }
  return null;
}

function generateBatchNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RC-${yyyy}${mm}${dd}-${random}`;
}

function parseTime(timeStr: string): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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
    const today = new Date().toISOString().slice(0, 10);
    return { date: today, storageInDate: today, batchNumber: generateBatchNumber() };
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
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const labelBarcodeRef = useRef<HTMLCanvasElement>(null);
  const labelQrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (savedRecord && barcodeRef.current) {
      try {
        bwipjs.toCanvas(barcodeRef.current, {
          bcid: "code128",
          text: savedRecord.batchRecordId || "",
          scale: 3,
          height: 10,
          includetext: false,
          textxalign: "center"
        });
      } catch (err) {
        console.error("Barcode generation failed", err);
      }
    }
  }, [savedRecord]);

  useEffect(() => {
    if (savedRecord && qrRef.current) {
      const url = `${window.location.origin}/scan/${encodeURIComponent(savedRecord.batchRecordId || "")}`;
      QRCode.toCanvas(qrRef.current, url, { width: 160, margin: 2 }, (err) => {
        if (err) console.error("QR generation failed", err);
      });
    }
  }, [savedRecord]);

  useEffect(() => {
    if (savedRecord && labelBarcodeRef.current) {
      try {
        bwipjs.toCanvas(labelBarcodeRef.current, {
          bcid: "code128",
          text: savedRecord.batchRecordId || "",
          scale: 3,
          height: 10,
          includetext: false,
          textxalign: "center"
        });
      } catch (err) {
        console.error("Label barcode generation failed", err);
      }
    }
  }, [savedRecord]);

  useEffect(() => {
    if (savedRecord && labelQrRef.current) {
      const url = `${window.location.origin}/scan/${encodeURIComponent(savedRecord.batchRecordId || "")}`;
      QRCode.toCanvas(labelQrRef.current, url, { width: 120, margin: 2 }, (err) => {
        if (err) console.error("Label QR generation failed", err);
      });
    }
  }, [savedRecord]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "date" && value && !next.storageInDate) {
        next.storageInDate = value;
      }
      return next;
    });
  };

  const handleProductChange = (value: string) => {
    const updates: Record<string, string> = { product: value };
    if (value.toLowerCase().includes("kulfi")) {
      updates.ingredients = KULFI_INGREDIENTS;
      updates.allergens = KULFI_ALLERGENS;
      updates.netWeight = KULFI_NET_WEIGHT;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleUseCurrentTime = (key: string) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    handleChange(key, time);
  };

  const handleSaveDraft = () => {
    const draft = { ...formData, labelOk };
    localStorage.setItem("raja-catering-production-draft", JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveRecord = async () => {
    const missing = requiredFields.filter((key) => !formData[key] || formData[key].trim() === "");
    if (!labelOk) missing.push("labelOk");

    const storageInstruction = formData.storageInstruction;
    const storageTemp = formData.storageTemperature;
    const tempError = getStorageTemperatureError(storageInstruction, storageTemp);
    if (tempError) {
      missing.push("storageTemperature");
      setValidationErrors([...missing, "storageTemperatureInvalid"]);
      return;
    }

    const coolingStart = parseTime(formData.coolingStartTime || "");
    const coolingFinal = parseTime(formData.coolingFinalTime || "");
    const coolingDurationMs = coolingStart && coolingFinal ? coolingFinal.getTime() - coolingStart.getTime() : null;
    const coolingDurationExceeded = coolingDurationMs !== null && coolingDurationMs > 90 * 60000;
    const finalTemp = parseFloat(formData.coolingFinalTemperature || "");
    const finalTempTooHigh = !isNaN(finalTemp) && finalTemp >= 8;

    if (coolingDurationExceeded) {
      missing.push("coolingFinalTime");
    }
    if (finalTempTooHigh) {
      missing.push("coolingFinalTemperature");
    }

    if (missing.length > 0) {
      setValidationErrors(missing);
      return;
    }
    setValidationErrors([]);
    const record: Record<string, string> = { ...formData, labelOk };
    const batchRecordId = `RC-${Date.now().toString(36).toUpperCase()}`;
    record.batchRecordId = batchRecordId;
    if (coolingDurationMs !== null) {
      record.coolingDuration = formatDuration(coolingDurationMs);
    }

    try {
      const response = await fetch("/api/production-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save record", errorData);
        setValidationErrors(["Failed to save record. Please try again."]);
        return;
      }
      const saved = await response.json();
      setSavedRecord(saved);
    } catch (err) {
      console.error("Failed to save record", err);
      setValidationErrors(["Failed to save record. Please try again."]);
    }
  };

  const handlePrintLabel = () => {
    if (!savedRecord) return;
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) return;

    const barcodeCanvas = labelBarcodeRef.current;
    const qrCanvas = labelQrRef.current;
    const barcodeDataUrl = barcodeCanvas ? barcodeCanvas.toDataURL("image/png") : "";
    const qrDataUrl = qrCanvas ? qrCanvas.toDataURL("image/png") : "";

    const labelHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Label</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .label { border: 2px solid #000; padding: 16px; width: 300px; margin: 0 auto; }
            .brand { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
            .row-label { font-weight: bold; }
            .barcode { text-align: center; margin-top: 8px; }
            .barcode img { max-width: 100%; height: auto; }
            .qr { text-align: center; margin-top: 8px; }
            .qr img { width: 120px; height: 120px; }
            .net-weight { text-align: center; font-weight: bold; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand">Raja Catering</div>
            <div class="row"><span class="row-label">Product:</span> <span>${savedRecord.product || ""}</span></div>
            <div class="row"><span class="row-label">Flavour:</span> <span>${savedRecord.flavour || ""}</span></div>
            <div class="row"><span class="row-label">Batch Number:</span> <span>${savedRecord.batchNumber || ""}</span></div>
            <div class="row"><span class="row-label">Production Date:</span> <span>${savedRecord.date || ""}</span></div>
            <div class="row"><span class="row-label">Use By Date:</span> <span>${savedRecord.useByDate || ""}</span></div>
            <div class="net-weight">Net WT ${savedRecord.netWeight || "85 g"}</div>
            <div class="row"><span class="row-label">Allergens:</span> <span>${savedRecord.allergens || ""}</span></div>
            <div class="row"><span class="row-label">Storage Instruction:</span> <span>${savedRecord.storageInstruction || ""}</span></div>
            <div class="row"><span class="row-label">Storage Temperature:</span> <span>${savedRecord.storageTemperature ? formatTemperature(savedRecord.storageTemperature) : ""}</span></div>
            <div class="barcode">${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode" />` : ""}</div>
            <div class="qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(labelHtml);
    printWindow.document.close();
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
                <dt className="text-sm font-semibold text-slate-500">Net Weight</dt>
                <dd className="text-base font-medium">{scanView.netWeight || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Allergens</dt>
                <dd className="text-base font-medium">{scanView.allergens || "—"}</dd>
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
                <dt className="text-sm font-semibold text-slate-500">Storage Temperature</dt>
                <dd className="text-base font-medium">
                  {scanView.storageTemperature ? formatTemperature(scanView.storageTemperature) : "—"}
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
                <dt className="text-sm font-semibold text-slate-500">Cooling Duration</dt>
                <dd className="text-base font-medium text-slate-900">{savedRecord.coolingDuration || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Label OK?</dt>
                <dd className="text-base font-medium text-slate-900">{savedRecord.labelOk || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-500">Storage Temperature</dt>
                <dd className="text-base font-medium text-slate-900">
                  {savedRecord.storageTemperature ? formatTemperature(savedRecord.storageTemperature) : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-slate-300 bg-slate-50 p-4 text-center">
                <h3 className="mb-2 text-sm font-semibold text-slate-500">Code 128 Barcode</h3>
                <canvas ref={barcodeRef} className="mx-auto" />
                <div className="mt-2 font-mono text-xs text-slate-700">{savedRecord.batchRecordId}</div>
              </div>
              <div className="rounded border border-slate-300 bg-slate-50 p-4 text-center">
                <h3 className="mb-2 text-sm font-semibold text-slate-500">QR Code</h3>
                <canvas ref={qrRef} className="mx-auto" />
                <button
                  type="button"
                  onClick={() => setScanView(savedRecord)}
                  className="mt-2 inline-flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Scan
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handlePrintLabel}
                className="h-11 cursor-pointer rounded bg-slate-800 px-6 text-base font-semibold text-white hover:bg-slate-700"
              >
                Print Label
              </button>
              <button
                type="button"
                onClick={() => setSavedRecord(null)}
                className="h-11 cursor-pointer rounded bg-sky-500 px-6 text-base font-semibold text-slate-950 hover:bg-sky-400"
              >
                Back to Form
              </button>
            </div>

            <div className="hidden">
              <canvas ref={labelBarcodeRef} />
              <canvas ref={labelQrRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storageInstruction = formData.storageInstruction || "";
  const storageTempError = getStorageTemperatureError(storageInstruction, formData.storageTemperature || "");

  const coolingStart = parseTime(formData.coolingStartTime || "");
  const coolingFinal = parseTime(formData.coolingFinalTime || "");
  const coolingDurationMs = coolingStart && coolingFinal ? coolingFinal.getTime() - coolingStart.getTime() : null;
  const coolingDurationExceeded = coolingDurationMs !== null && coolingDurationMs > 90 * 60000;
  const finalTemp = parseFloat(formData.coolingFinalTemperature || "");
  const finalTempTooHigh = !isNaN(finalTemp) && finalTemp >= 8;
  const coolingComplete = !isNaN(finalTemp) && finalTemp < 8;

  const coolingDeadline = coolingStart ? new Date(coolingStart.getTime() + 90 * 60000) : null;
  const coolingDeadlineStr = coolingDeadline
    ? coolingDeadline.toTimeString().slice(0, 5)
    : "";

  const coolingDurationDisplay = coolingDurationMs !== null ? formatDuration(coolingDurationMs) : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Production</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide">
            Daily Kulfi Production Sheet
          </h2>

          <div className="mb-6 rounded border border-slate-300 bg-slate-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-500">Cooling → Freezer Workflow</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-slate-200 px-2 py-1 font-medium text-slate-700">Cooling complete</span>
              <span className="text-slate-400">→</span>
              <span className={`rounded px-2 py-1 font-medium ${coolingComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {coolingComplete ? "Below 8°C ✓" : "Below 8°C"}
              </span>
              <span className="text-slate-400">→</span>
              <span className="rounded bg-slate-200 px-2 py-1 font-medium text-slate-700">Moved to freezer</span>
              <span className="text-slate-400">→</span>
              <span className="rounded bg-slate-200 px-2 py-1 font-medium text-slate-700">Freezer storage temperature recorded</span>
            </div>
            {!coolingComplete && formData.coolingFinalTemperature && (
              <p className="mt-2 text-sm font-semibold text-amber-600">
                Cooling Final Temperature must be below 8°C before transferring to freezer.
              </p>
            )}
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                if (field.key === "coolingStartTime" || field.key === "coolingFinalTime") {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-1 text-sm font-semibold">{field.label}</label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                          value={formData[field.key] || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleUseCurrentTime(field.key)}
                          className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Use current time
                        </button>
                      </div>
                      {field.key === "coolingStartTime" && formData.coolingStartTime && (
                        <p className="mt-1 text-sm text-slate-500">
                          Cooling must be completed within 90 minutes. Deadline: {coolingDeadlineStr}.
                        </p>
                      )}
                    </div>
                  );
                }

                if (field.key === "coolingStartTemperature") {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-1 text-sm font-semibold">{field.label}</label>
                      <input
                        type="number"
                        className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                      <p className="mt-1 text-sm text-slate-500">Target/reference: about 63°C.</p>
                    </div>
                  );
                }

                if (field.key === "coolingFinalTemperature") {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-1 text-sm font-semibold">{field.label}</label>
                      <input
                        type="number"
                        className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                      <p className="mt-1 text-sm text-slate-500">Target: below 8°C before freezer transfer.</p>
                      {coolingDurationDisplay && (
                        <p className="mt-1 text-sm font-semibold text-slate-700">Cooling Duration: {coolingDurationDisplay}</p>
                      )}
                      {coolingDurationExceeded && (
                        <p className="mt-1 text-sm font-semibold text-red-600">Cooling duration exceeds 90 minutes. Correct the cooling time.</p>
                      )}
                      {finalTempTooHigh && (
                        <p className="mt-1 text-sm font-semibold text-red-600">Cooling Final Temperature must be below 8°C. Correct the temperature.</p>
                      )}
                      {coolingComplete && (
                        <p className="mt-1 text-sm font-semibold text-emerald-600">Cooling complete — ready for freezer transfer.</p>
                      )}
                    </div>
                  );
                }

                if (field.key === "heatTreatmentTemperature") {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-1 text-sm font-semibold">{field.label}</label>
                      <input
                        type="number"
                        className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                      <p className="mt-1 text-sm text-slate-500">Typical working range: 85°C–100°C.</p>
                    </div>
                  );
                }

                return (
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
                    ) : field.type === "time" ? (
                      <div className="flex gap-2">
                        <input
                          type="time"
                          className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                          value={formData[field.key] || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleUseCurrentTime(field.key)}
                          className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Use current time
                        </button>
                      </div>
                    ) : field.key === "batchNumber" ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                          value={formData[field.key] || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleChange("batchNumber", generateBatchNumber())}
                          className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Regenerate
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

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

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Storage Temperature (freezer/equipment)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="h-11 w-full cursor-text rounded border-2 border-slate-400 bg-white px-3 text-base focus:border-sky-500 focus:outline-none"
                    value={formData.storageTemperature || ""}
                    onChange={(e) => handleChange("storageTemperature", e.target.value)}
                    placeholder="e.g. -18"
                  />
                  <span className="text-base font-semibold">°C</span>
                </div>
                {formData.storageTemperature && (
                  <p className="mt-1 text-sm text-slate-500">
                    Display: {formatTemperature(formData.storageTemperature)}
                  </p>
                )}
                {storageTempError && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{storageTempError}</p>
                )}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Please correct the following:</p>
                <ul className="mt-1 list-inside list-disc">
                  {validationErrors.map((key) => {
                    if (key === "storageTemperatureInvalid") {
                      return (
                        <li key={key}>
                          {storageTempError || "Storage Temperature is invalid for the selected Storage Instruction."}
                        </li>
                      );
                    }
                    const field = fields.find((f) => f.key === key);
                    return <li key={key}>{field ? field.label : key === "labelOk" ? "Label OK?" : key === "storageTemperature" ? "Storage Temperature" : key === "coolingFinalTemperature" ? "Cooling Final Temperature" : key === "coolingFinalTime" ? "Cooling Final Time" : key}</li>;
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
