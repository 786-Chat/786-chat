"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const DB_NAME = "786-food-safety-approved-pdf"
const STORE_NAME = "files"
const FILE_KEY = "raja-catering-approved-197-page-pdf"
const TOTAL_PAGES = 197

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function savePdf(file: File) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(file, FILE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function loadPdf(): Promise<Blob | null> {
  const db = await openDb()
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).get(FILE_KEY)
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return result
}

async function clearPdf() {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(FILE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export default function ApprovedPdfViewer() {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    loadPdf()
      .then((blob) => { if (active && blob) setPdfBlob(blob) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!pdfBlob) {
      setPdfUrl("")
      return
    }
    const url = URL.createObjectURL(pdfBlob)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pdfBlob])

  const viewerSrc = useMemo(() => {
    if (!pdfUrl) return ""
    return `${pdfUrl}#page=${page}&zoom=page-fit&toolbar=0&navpanes=0`
  }, [pdfUrl, page])

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose the approved 197-page PDF file.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await savePdf(file)
      setPdfBlob(file)
      setPage(1)
      setPageInput("1")
    } catch {
      setError("The PDF could not be saved in this browser. You can still retry the upload.")
    } finally {
      setLoading(false)
    }
  }

  function jump() {
    const next = Math.max(1, Math.min(TOTAL_PAGES, Number.parseInt(pageInput, 10) || 1))
    setPage(next)
    setPageInput(String(next))
  }

  function move(delta: number) {
    const next = Math.max(1, Math.min(TOTAL_PAGES, page + delta))
    setPage(next)
    setPageInput(String(next))
  }

  async function removeStoredPdf() {
    await clearPdf().catch(() => {})
    setPdfBlob(null)
    setPage(1)
    setPageInput("1")
  }

  return (
    <section style={{ minHeight: "100vh", background: "#eef3f1", color: "#18352a", padding: 12 }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "12px 14px", borderRadius: 14, background: "linear-gradient(135deg,#083c2e,#0b513d)", color: "white", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".14em", color: "#f4cc4f" }}>APPROVED PDF - EXACT VIEW</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>Raja Catering - 197-page Food Safety Record Book</div>
            <div style={{ fontSize: 12, opacity: .8 }}>Shows the real approved PDF pages, including portrait and landscape A4 pages.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => inputRef.current?.click()} style={buttonStyle}>Upload / Replace Approved PDF</button>
            {pdfUrl ? <a href={pdfUrl} target="_blank" rel="noreferrer" style={linkStyle}>Open Full PDF</a> : null}
            {pdfUrl ? <a href={pdfUrl} download="Raja_Catering_FINAL_197_Page_Record_Book_FOOTER_FIXED.pdf" style={linkStyle}>Save PDF Copy</a> : null}
          </div>
        </div>

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(event) => handleFile(event.target.files?.[0])} style={{ display: "none" }} />

        {error ? <div style={{ marginBottom: 10, padding: 10, border: "1px solid #d88", background: "#fff1ef", borderRadius: 10, color: "#8c2f2a" }}>{error}</div> : null}

        {!pdfBlob && !loading ? (
          <div style={{ maxWidth: 850, margin: "50px auto", padding: 28, borderRadius: 18, background: "white", border: "2px dashed #d9a520", textAlign: "center", boxShadow: "0 18px 45px rgba(14,46,34,.12)" }}>
            <div style={{ fontSize: 48 }}>📄</div>
            <h2 style={{ margin: "10px 0 8px", color: "#0b513d" }}>Load the approved 197-page PDF</h2>
            <p style={{ margin: "0 auto 16px", maxWidth: 650, lineHeight: 1.55, color: "#607169" }}>
              Choose <b>Raja_Catering_FINAL_197_Page_Record_Book_FOOTER_FIXED.pdf</b> from your computer. The file is stored in this browser and the Live Preview uses the actual PDF instead of recreating its pages.
            </p>
            <button type="button" onClick={() => inputRef.current?.click()} style={{ ...buttonStyle, background: "#d9a520", color: "#173421", borderColor: "#d9a520", fontSize: 16 }}>Upload Approved PDF</button>
          </div>
        ) : null}

        {loading ? <div style={{ padding: 40, textAlign: "center", fontWeight: 800 }}>Loading approved PDF...</div> : null}

        {pdfBlob && pdfUrl && !loading ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: 10, borderRadius: 12, background: "white", border: "1px solid #c7d4ce", marginBottom: 10 }}>
              <button type="button" onClick={() => move(-1)} disabled={page === 1} style={buttonStyle}>← Previous</button>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800 }}>
                Page
                <input value={pageInput} onChange={(event) => setPageInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") jump() }} style={{ width: 72, padding: "8px 9px", border: "1px solid #b8c8c0", borderRadius: 8 }} />
                of {TOTAL_PAGES}
              </label>
              <button type="button" onClick={jump} style={buttonStyle}>Go</button>
              <button type="button" onClick={() => move(1)} disabled={page === TOTAL_PAGES} style={buttonStyle}>Next →</button>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#607169" }}>Original A4 page size and orientation</span>
              <button type="button" onClick={removeStoredPdf} style={{ ...buttonStyle, color: "#8a2f28", borderColor: "#efc5bf", background: "#fff2f0" }}>Remove Stored PDF</button>
            </div>

            <div style={{ width: "100%", height: "calc(100vh - 190px)", minHeight: 720, borderRadius: 14, overflow: "hidden", border: "1px solid #0b513d", background: "#dfe7e3", boxShadow: "0 18px 45px rgba(14,46,34,.15)" }}>
              <iframe key={`${pdfUrl}-${page}`} title={`Approved Food Safety PDF page ${page}`} src={viewerSrc} style={{ width: "100%", height: "100%", border: 0, background: "#dfe7e3" }} />
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

const buttonStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 13px",
  borderRadius: 9,
  border: "1px solid #b9cbc2",
  background: "#f8fbf9",
  color: "#0b513d",
  fontWeight: 900,
  cursor: "pointer",
}

const linkStyle: React.CSSProperties = {
  ...buttonStyle,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
}
