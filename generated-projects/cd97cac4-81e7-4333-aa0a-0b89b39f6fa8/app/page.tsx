"use client"

import { useState } from "react"
import FoodSafetyBook from "@/components/food-safety-book"
import ApprovedPdfMode from "@/components/approved-pdf-mode"

export default function Page() {
  const [tab, setTab] = useState<"pdf" | "edit">("pdf")

  return (
    <main className="app-shell">
      <div className="workspace no-print">
        <div className="mode-tabs">
          <button
            type="button"
            className={tab === "pdf" ? "mode-tab active" : "mode-tab"}
            onClick={() => setTab("pdf")}
          >
            Approved PDF — Exact View
          </button>
          <button
            type="button"
            className={tab === "edit" ? "mode-tab active" : "mode-tab"}
            onClick={() => setTab("edit")}
          >
            Editable Master Setup
          </button>
        </div>
      </div>

      {tab === "pdf" ? <ApprovedPdfMode /> : <FoodSafetyBook />}
    </main>
  )
}
