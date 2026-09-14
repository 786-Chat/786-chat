"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const TOTAL_PAGES = 197
const DB_NAME = "approved-pdf-db"
const STORE_NAME = "pdfs"
const KEY = "approved-pdf"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function savePdf(blob: Blob) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(blob, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadPdf(): Promise<Blob | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).get(KEY)
    request.onsuccess = () => resolve((request.result as Blob) ?? null)
    request.onerror = () => reject(request.error)
  })
}

export default function ApprovedPdfMode() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [goPage, setGoPage] = useState("1")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    loadPdf().then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }
    const blob = file
    await savePdf(blob)
    const url = URL.createObjectURL(blob)
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setPage(1)
    setGoPage("1")
  }, [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const goToPage = () => {
    const p = parseInt(goPage, 10)
    if (!isNaN(p) && p >= 1 && p <= TOTAL_PAGES) {
      setPage(p)
    } else {
      setGoPage(String(page))
    }
  }

  const openFull = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank")
  }

  const saveCopy = async () => {
    if (!pdfUrl) return
    const blob = await loadPdf()
    if (!blob) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "approved-food-safety-record-book.pdf"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="approved-pdf-mode">
      <div className="pdf-toolbar no-print">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload Approved PDF
        </button>
        <button type="button" onClick={openFull} disabled={!pdfUrl}>
          Open Full PDF
        </button>
        <button type="button" onClick={saveCopy} disabled={!pdfUrl}>
          Save PDF Copy
        </button>
      </div>

      {pdfUrl ? (
        <div className="pdf-viewer">
          <iframe
            src={`${pdfUrl}#page=${page}`}
            title="Approved PDF"
            className="pdf-frame"
          />
          <div className="pdf-controls no-print">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {TOTAL_PAGES}
            </span>
            <input
              type="number"
              min={1}
              max={TOTAL_PAGES}
              value={goPage}
              onChange={(e) => setGoPage(e.target.value)}
              className="page-input"
            />
            <button type="button" onClick={goToPage}>
              Go
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              disabled={page >= TOTAL_PAGES}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="pdf-empty">
          <p>No approved PDF uploaded yet.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Upload Approved PDF
          </button>
        </div>
      )}
    </div>
  )
}
