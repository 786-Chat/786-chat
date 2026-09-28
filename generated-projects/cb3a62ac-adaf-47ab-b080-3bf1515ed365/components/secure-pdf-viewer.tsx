"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Maximize2, Printer, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  title: string;
  contentUrl: string;
  fileSize?: number;
  onClose: () => void;
};

function prettySize(bytes?: number) {
  if (!bytes) return "PDF";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SecurePdfViewer({ title, contentUrl, fileSize, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let task: any;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(contentUrl, { credentials: "include", cache: "no-store" });
        if (!response.ok) {
          throw new Error(response.status === 401 ? "Please sign in again to view this document." : "PDF could not be loaded.");
        }
        const data = await response.arrayBuffer();
        const pdfjs = await import("pdfjs-dist/webpack.mjs");
        task = pdfjs.getDocument({ data });
        const loaded = await task.promise;
        if (cancelled) {
          await loaded.destroy();
          return;
        }
        setPdf(loaded);
        setPages(loaded.numPages || 0);
        setPage(1);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "PDF could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      try { task?.destroy?.(); } catch {}
    };
  }, [contentUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: any;
    (async () => {
      try {
        setRendering(true);
        setError(null);
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const hostWidth = Math.max(360, (hostRef.current?.clientWidth || 900) - 40);
        const fitScale = fitWidth ? Math.min(2, hostWidth / base.width) : 1.15;
        const viewport = pdfPage.getViewport({ scale: fitScale * zoom });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("PDF canvas is unavailable.");
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("PDF canvas is unavailable.");
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport,
          transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
        });
        await renderTask.promise;
      } catch (e: any) {
        if (!cancelled && e?.name !== "RenderingCancelledException") {
          setError(e?.message || "This PDF page could not be rendered.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
      try { renderTask?.cancel?.(); } catch {}
    };
  }, [pdf, page, zoom, fitWidth]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setPage((value) => Math.max(1, value - 1));
      if (event.key === "ArrowRight") setPage((value) => Math.min(pages || 1, value + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pages]);

  const openForPrint = () => window.open(contentUrl, "_blank", "noopener,noreferrer");
  const download = () => {
    const a = document.createElement("a");
    a.href = `${contentUrl}?download=1`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white sm:text-base">{title}</h3>
            <p className="text-xs text-slate-400">{prettySize(fileSize)} · Secure document</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page <= 1} className="rounded p-2 text-slate-200 hover:bg-slate-800 disabled:opacity-30" title="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[68px] text-center text-xs font-semibold text-slate-200">{pages ? `${page}/${pages}` : "—"}</span>
            <button type="button" onClick={() => setPage((v) => Math.min(pages || 1, v + 1))} disabled={!pages || page >= pages} className="rounded p-2 text-slate-200 hover:bg-slate-800 disabled:opacity-30" title="Next page"><ChevronRight className="h-4 w-4" /></button>
            <div className="mx-1 h-6 w-px bg-slate-700" />
            <button type="button" onClick={() => setZoom((v) => Math.max(0.5, v - 0.15))} className="rounded p-2 text-slate-200 hover:bg-slate-800" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
            <span className="hidden min-w-[42px] text-center text-xs text-slate-300 sm:inline">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((v) => Math.min(3, v + 0.15))} className="rounded p-2 text-slate-200 hover:bg-slate-800" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
            <button type="button" onClick={() => { setFitWidth((v) => !v); setZoom(1); }} className={`rounded p-2 text-slate-200 hover:bg-slate-800 ${fitWidth ? "bg-slate-800" : ""}`} title="Fit width"><Maximize2 className="h-4 w-4" /></button>
            <button type="button" onClick={openForPrint} className="rounded p-2 text-slate-200 hover:bg-slate-800" title="Print"><Printer className="h-4 w-4" /></button>
            <button type="button" onClick={download} className="rounded p-2 text-slate-200 hover:bg-slate-800" title="Download"><Download className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} className="rounded p-2 text-slate-200 hover:bg-slate-800" title="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div ref={hostRef} className="relative flex-1 overflow-auto bg-slate-800/80 p-4 sm:p-6">
          {loading && <div className="flex h-full items-center justify-center text-sm text-slate-300">Loading PDF…</div>}
          {error && <div className="mx-auto mt-8 max-w-xl rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>}
          {!loading && !error && (
            <div className="mx-auto flex min-h-full w-max min-w-full justify-center">
              <div className="relative h-max bg-white shadow-2xl">
                <canvas ref={canvasRef} className="block max-w-none bg-white" />
                {rendering && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold text-slate-600">Rendering page…</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
