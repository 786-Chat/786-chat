"use client"

import { useState } from "react"
import ApprovedPdfViewer from "@/components/approved-pdf-viewer"
import FoodSafetyBook from "@/components/food-safety-book"

export default function FoodSafetyProject() {
  const [mode, setMode] = useState<"approved" | "editable">("approved")

  return (
    <div style={{ minHeight: "100vh", background: "#081827" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap", padding: 8, background: "#071322", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <button
          type="button"
          onClick={() => setMode("approved")}
          style={tabStyle(mode === "approved")}
        >
          Approved PDF - Exact View
        </button>
        <button
          type="button"
          onClick={() => setMode("editable")}
          style={tabStyle(mode === "editable")}
        >
          Editable Master Setup
        </button>
        <span style={{ color: "#a8b8c8", fontSize: 12 }}>
          Exact View uses the real approved 197-page PDF. Editable Setup keeps your reusable customer fields.
        </span>
      </div>
      {mode === "approved" ? <ApprovedPdfViewer /> : <FoodSafetyBook />}
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 38,
    padding: "0 14px",
    borderRadius: 9,
    border: active ? "1px solid #f1c24d" : "1px solid #355064",
    background: active ? "#f1c24d" : "#102437",
    color: active ? "#173421" : "#e9f0f4",
    fontWeight: 900,
    cursor: "pointer",
  }
}
