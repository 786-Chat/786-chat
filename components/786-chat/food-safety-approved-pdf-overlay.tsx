"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { loadBuilderProject } from "./api"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const TEMPLATE_ID = "food-safety-record-book"
const KNOWN_FOOD_SAFETY_PROJECT_ID = "fd542697-fb5b-46c6-8435-7276a05e2e0e"
const TOTAL_PAGES = 197
const DB_NAME = "786-chat-approved-food-safety-pdf"
const STORE_NAME = "approved-pdfs"
const EXPECTED_FILE = "Raja_Catering_FINAL_197_Page_Record_Book_FOOTER_FIXED.pdf"

type PreviewBounds = {
  left: number
  top: number
  width: number
  height: number
  editableUrl: string
}

type StoredPdf = {
  projectId: string
  name: string
  blob: Blob
  updatedAt: number
}

function openPdfDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "projectId" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Could not open PDF storage."))
  })
}

async function readStoredPdf(projectId: string) {
  const db = await openPdfDb()
  try {
    return await new Promise<StoredPdf | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const request = transaction.objectStore(STORE_NAME).get(projectId)
      request.onsuccess = () => resolve((request.result as StoredPdf | undefined) || null)
      request.onerror = () => reject(request.error || new Error("Could not read approved PDF."))
    })
  } finally {
    db.close()
  }
}

async function writeStoredPdf(projectId: string, file: File) {
  const db = await openPdfDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      transaction.objectStore(STORE_NAME).put({
        projectId,
        name: file.name || EXPECTED_FILE,
        blob: file,
        updatedAt: Date.now(),
      } satisfies StoredPdf)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error("Could not save approved PDF."))
      transaction.onabort = () => reject(transaction.error || new Error("Could not save approved PDF."))
    })
  } finally {
    db.close()
  }
}

function locateLivePreview(): PreviewBounds | null {
  const labels = Array.from(document.querySelectorAll("span"))
  const label = labels.find((node) => node.textContent?.trim() === "Live preview")
  const panel = label?.closest("section") as HTMLElement | null
  if (!panel) return null

  const rect = panel.getBoundingClientRect()
  if (rect.width < 220 || rect.height < 220 || rect.bottom < 0 || rect.top > window.innerHeight) return null

  const compiledFrame = panel.querySelector('iframe[title$="compiled preview"]') as HTMLIFrameElement | null
  const editableUrl = compiledFrame?.src || ""

  return {
    left: Math.max(0, rect.left + 8),
    top: Math.max(0, rect.top + 49),
    width: Math.max(220, rect.width - 16),
    height: Math.max(220, rect.height - 57),
    editableUrl,
  }
}

function sameBounds(a: PreviewBounds | null, b: PreviewBounds | null) {
  if (!a || !b) return a === b
  return Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1 &&
    a.editableUrl === b.editableUrl
}

function isFoodSafetyProject(project: Awaited<ReturnType<typeof loadBuilderProject>>["project"]) {
  const title = String(project.title || "")
  const files = project.files || {}
  return project.id === KNOWN_FOOD_SAFETY_PROJECT_ID ||
    project.metadata?.template_id === TEMPLATE_ID ||
    /food safety record book/i.test(title) ||
    Boolean(files["components/food-safety-book.tsx"])
}

export function FoodSafetyApprovedPdfOverlay() {
  const [projectId, setProjectId] = useState("")
  const [isFoodSafety, setIsFoodSafety] = useState(false)
  const [bounds, setBounds] = useState<PreviewBounds | null>(null)
  const [mode, setMode] = useState<"approved" | "editable">("approved")
  const [pdfUrl, setPdfUrl] = useState("")
  const [pdfName, setPdfName] = useState("")
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const [message, setMessage] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef("")

  const replaceObjectUrl = useCallback((blob: Blob | null, name = "") => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = blob ? URL.createObjectURL(blob) : ""
    setPdfUrl(objectUrlRef.current)
    setPdfName(name)
  }, [])

  useEffect(() => {
    setHydrated(true)
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false
    let lastId = ""

    const inspectProject = async () => {
      const id = window.localStorage.getItem(ACTIVE_PROJECT_KEY) || ""
      if (id === lastId) return
      lastId = id
      setProjectId(id)
      setIsFoodSafety(false)
      setMode("approved")
      setPage(1)
      setPageInput("1")
      setMessage("")
      replaceObjectUrl(null)
      if (!id) return

      try {
        const result = await loadBuilderProject(id)
        if (cancelled) return
        const foodSafety = isFoodSafetyProject(result.project)
        setIsFoodSafety(foodSafety)
        if (!foodSafety) return

        const stored = await readStoredPdf(id).catch(() => null)
        if (cancelled || !stored?.blob) return
        replaceObjectUrl(stored.blob, stored.name || EXPECTED_FILE)
      } catch {
        if (!cancelled) {
          setIsFoodSafety(id === KNOWN_FOOD_SAFETY_PROJECT_ID)
        }
      }
    }

    void inspectProject()
    const timer = window.setInterval(() => void inspectProject(), 700)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [hydrated, replaceObjectUrl])

  useEffect(() => {
    if (!isFoodSafety) {
      setBounds(null)
      return
    }

    const update = () => {
      const next = locateLivePreview()
      setBounds((current) => sameBounds(current, next) ? current : next)
    }

    update()
    const timer = window.setInterval(update, 250)
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [isFoodSafety])

  const pdfPageUrl = useMemo(() => {
    if (!pdfUrl) return ""
    return `${pdfUrl}#page=${page}&view=Fit&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`
  }, [pdfUrl, page])

  const jumpToPage = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10)
    const next = Number.isFinite(parsed) ? Math.min(TOTAL_PAGES, Math.max(1, parsed)) : 1
    setPage(next)
    setPageInput(String(next))
  }, [pageInput])

  const choosePdf = useCallback(async (file: File | null) => {
    if (!file || !projectId) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("Please select the approved 197-page PDF file.")
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      setMessage("The approved PDF must be 30MB or smaller.")
      return
    }

    try {
      await writeStoredPdf(projectId, file)
      replaceObjectUrl(file, file.name || EXPECTED_FILE)
      setMode("approved")
      setPage(1)
      setPageInput("1")
      setMessage("Approved PDF loaded. Each real PDF page now fills the viewer using its original portrait or landscape orientation.")
    } catch {
      setMessage("The PDF opened, but this browser could not save it for future refreshes.")
      replaceObjectUrl(file, file.name || EXPECTED_FILE)
    }
  }, [projectId, replaceObjectUrl])

  if (!hydrated || !isFoodSafety || !bounds) return null

  const shellStyle: React.CSSProperties = {
    position: "fixed",
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    zIndex: 70,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 10,
    border: "1px solid #263550",
    background: "#07101d",
    boxShadow: "0 20px 55px rgba(0,0,0,.34)",
  }

  const buttonStyle: React.CSSProperties = {
    height: 34,
    borderRadius: 8,
    border: "1px solid #31445f",
    background: "#0d1829",
    color: "#dce7f8",
    padding: "0 12px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  }

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    border: "1px solid #d6a82c",
    background: "linear-gradient(135deg,#f5d36b,#d9a520)",
    color: "#143426",
  }

  const overlay = (
    <div style={shellStyle} data-food-safety-approved-pdf-overlay="true">
      <div style={{ minHeight: 52, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 10px", borderBottom: "1px solid #263550", background: "#081522" }}>
        <button type="button" style={mode === "approved" ? activeButtonStyle : buttonStyle} onClick={() => setMode("approved")}>Approved PDF - Exact View</button>
        <button type="button" style={mode === "editable" ? activeButtonStyle : buttonStyle} onClick={() => setMode("editable")}>Editable Master Setup</button>
        {mode === "approved" && (
          <>
            <button type="button" style={buttonStyle} onClick={() => fileInputRef.current?.click()}>{pdfUrl ? "Replace Approved PDF" : "Load Approved 197-page PDF"}</button>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => {
              const file = event.target.files?.[0] || null
              void choosePdf(file)
              event.currentTarget.value = ""
            }} />
            {pdfUrl && <button type="button" style={buttonStyle} onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}>Open Full PDF</button>}
            {pdfUrl && <button type="button" style={buttonStyle} onClick={() => {
              const anchor = document.createElement("a")
              anchor.href = pdfUrl
              anchor.download = pdfName || EXPECTED_FILE
              anchor.click()
            }}>Save PDF Copy</button>}
          </>
        )}
      </div>

      {mode === "editable" ? (
        bounds.editableUrl ? (
          <iframe src={bounds.editableUrl} title="Editable Food Safety Master Setup" style={{ width: "100%", height: "100%", border: 0, background: "white" }} />
        ) : (
          <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, color: "#b7c5d9", textAlign: "center" }}>The editable preview is rebuilding. Switch back to Exact View or wait for Preview ready.</div>
        )
      ) : pdfUrl ? (
        <>
          <div style={{ minHeight: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 10px", borderBottom: "1px solid #263550", background: "#0a1525", color: "#dce7f8", fontSize: 13 }}>
            <button type="button" style={buttonStyle} disabled={page <= 1} onClick={() => {
              const next = Math.max(1, page - 1)
              setPage(next)
              setPageInput(String(next))
            }}>Previous</button>
            <strong>Page {page} of {TOTAL_PAGES}</strong>
            <input aria-label="PDF page number" value={pageInput} onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") jumpToPage() }} style={{ width: 66, height: 32, borderRadius: 7, border: "1px solid #31445f", background: "#07101d", color: "white", padding: "0 8px" }} />
            <button type="button" style={buttonStyle} onClick={jumpToPage}>Go</button>
            <button type="button" style={buttonStyle} disabled={page >= TOTAL_PAGES} onClick={() => {
              const next = Math.min(TOTAL_PAGES, page + 1)
              setPage(next)
              setPageInput(String(next))
            }}>Next</button>
            <span style={{ marginLeft: 8, maxWidth: "34%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#8fa1b8" }}>{pdfName || EXPECTED_FILE}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, width: "100%", overflow: "hidden", background: "#dfe5e2" }}>
            <iframe
              key={pdfPageUrl}
              src={pdfPageUrl}
              title="Approved 197-page Raja Catering Food Safety PDF"
              style={{ display: "block", width: "100%", height: "100%", minHeight: 0, border: 0, background: "#dfe5e2" }}
            />
          </div>
        </>
      ) : (
        <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault()
          void choosePdf(event.dataTransfer.files?.[0] || null)
        }} style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, overflow: "auto", background: "linear-gradient(145deg,#081522,#0b2630)" }}>
          <div style={{ width: "min(620px,92%)", borderRadius: 18, border: "1px solid rgba(217,165,32,.55)", background: "rgba(8,22,31,.92)", padding: 28, textAlign: "center", boxShadow: "0 18px 60px rgba(0,0,0,.28)" }}>
            <div style={{ color: "#f1c24d", fontSize: 12, fontWeight: 900, letterSpacing: ".14em" }}>APPROVED 197-PAGE VISUAL MASTER</div>
            <h2 style={{ margin: "10px 0 8px", color: "white", fontSize: 24 }}>Show the exact approved PDF</h2>
            <p style={{ margin: "0 auto 18px", maxWidth: 510, color: "#b9c7d7", lineHeight: 1.6, fontSize: 14 }}>The recreated HTML pages are hidden in Exact View. Select the approved PDF once. Portrait pages fill portrait A4 and landscape HACCP pages fill landscape A4 using the PDF&apos;s own page orientation.</p>
            <div style={{ margin: "0 auto 18px", maxWidth: 520, borderRadius: 10, background: "#06111c", border: "1px solid #263550", padding: "10px 12px", color: "#e7edf6", fontFamily: "monospace", fontSize: 12, overflowWrap: "anywhere" }}>{EXPECTED_FILE}</div>
            <button type="button" style={{ ...activeButtonStyle, minHeight: 42, padding: "0 18px" }} onClick={() => fileInputRef.current?.click()}>Choose Approved 197-page PDF</button>
            <p style={{ margin: "14px 0 0", color: "#7f93aa", fontSize: 12 }}>You can also drag the PDF onto this panel. It is stored in IndexedDB for this project on this browser.</p>
            {message && <p style={{ margin: "12px 0 0", color: "#f5d36b", fontSize: 13, fontWeight: 700 }}>{message}</p>}
          </div>
        </div>
      )}
      {message && pdfUrl && <div style={{ padding: "5px 10px", borderTop: "1px solid #263550", background: "#07101d", color: "#b6c5d8", fontSize: 11 }}>{message}</div>}
    </div>
  )

  return createPortal(overlay, document.body)
}
