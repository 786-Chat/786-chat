import { useState, useEffect, useRef, useCallback, type TouchEvent } from 'react';
import { Button } from '@/components/ui/button';
import { X, RotateCw, Download, ChevronLeft, ChevronRight, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';


/** Fetch the authenticated PDF as one file, avoiding fragile Safari range/stream reads. */
async function fetchPdfBytes(url: string, signal: AbortSignal, onRetry: () => void): Promise<Uint8Array> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (signal.aborted) throw new Error('Request cancelled');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    let retryable = true;
    try {
      const response = await fetch(url, {
        credentials: 'include', cache: 'no-store',
        headers: { Accept: 'application/pdf' }, signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) {
        retryable = false;
        throw new Error('Your login has expired or access is restricted. Please sign in again.');
      }
      if (response.status === 404) {
        retryable = false;
        throw new Error('The server cannot locate this PDF right now. Contact the administrator if this continues.');
      }
      if (!response.ok) throw new Error(`Document server returned HTTP ${response.status}.`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes('%PDF-')) {
        retryable = false;
        throw new Error('The server did not return a PDF. Please sign in again or try later.');
      }
      return bytes;
    } catch (cause: any) {
      if (signal.aborted) throw cause;
      const message = controller.signal.aborted
        ? 'The PDF request timed out. Check your connection and try again.'
        : cause instanceof Error ? cause.message : 'Unable to load this PDF right now.';
      if (!retryable || attempt === 2) throw new Error(message);
      onRetry();
      await new Promise<void>((resolve, reject) => {
        const delay = window.setTimeout(() => {
          signal.removeEventListener('abort', cancelDelay);
          resolve();
        }, 700 * (attempt + 1));
        const cancelDelay = () => { window.clearTimeout(delay); reject(new Error('Request cancelled')); };
        signal.addEventListener('abort', cancelDelay, { once: true });
      });
    } finally {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
    }
  }
  throw new Error('Unable to load this PDF right now.');
}

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  onClose: () => void;
  title?: string;
}

export default function PDFViewer({ fileUrl, fileName, fileSize, onClose, title }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading document…');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ start: number; last: number; zoom: number } | null>(null);
  const renderIdRef = useRef(0);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const loadTaskRef = useRef<any>(null);

  const ext = fileName.toLowerCase().split('.').pop() || '';
  const isPDF = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);

  const renderPage = useCallback(async (doc: any, pageNum: number, scale: number) => {
    const requestId = ++renderIdRef.current;
    const previous = renderTaskRef.current;
    if (previous) {
      previous.cancel();
      try { await previous.promise; } catch (_) { /* expected cancellation */ }
      if (renderTaskRef.current === previous) renderTaskRef.current = null;
    }
    const page = await doc.getPage(pageNum);
    if (requestId !== renderIdRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('PDF canvas unavailable');
    const available = Math.max(220, (scrollRef.current?.clientWidth || window.innerWidth) - (window.innerWidth < 640 ? 16 : 48));
    const fit = Math.min(1.5, available / page.getViewport({ scale: 1 }).width);
    const display = page.getViewport({ scale: fit * scale / 100 });
    const pixels = Math.max(0.5, Math.min(2, window.devicePixelRatio || 1,
      Math.sqrt(6500000 / (display.width * display.height))));
    const viewport = page.getViewport({ scale: fit * scale / 100 * pixels });
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    canvas.style.width = `${Math.ceil(display.width)}px`;
    canvas.style.height = `${Math.ceil(display.height)}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('PDF canvas context unavailable');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try { await task.promise; }
    finally { if (renderTaskRef.current === task) renderTaskRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isPDF) { setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setLoadingMessage('Loading document…');
    setError(null);
    setCurrentPage(1);
    setZoom(100);
    setTotalPages(0);
    renderIdRef.current += 1;
    if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
    if (loadTaskRef.current) { loadTaskRef.current.destroy().catch(() => {}); loadTaskRef.current = null; }
    if (pdfDocRef.current) { pdfDocRef.current.destroy().catch(() => {}); pdfDocRef.current = null; }

    (async () => {
      try {
        const bytes = await fetchPdfBytes(fileUrl, controller.signal, () => {
          if (active) setLoadingMessage('Connection interrupted. Retrying PDF…');
        });
        if (!active) return;
        const task = pdfjsLib.getDocument({ data: bytes });
        loadTaskRef.current = task;
        const doc = await task.promise;
        if (!active || loadTaskRef.current !== task) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setLoadingMessage('Displaying PDF…');
        await renderPage(doc, 1, 100);
        if (active) setLoading(false);
      } catch (cause: any) {
        if (!active) return;
        console.error('PDF load failed:', cause);
        setError(cause instanceof Error ? cause.message : 'Unable to open this PDF right now.');
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      renderIdRef.current += 1;
      if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
      if (loadTaskRef.current) { loadTaskRef.current.destroy().catch(() => {}); loadTaskRef.current = null; }
      if (pdfDocRef.current) { pdfDocRef.current.destroy().catch(() => {}); pdfDocRef.current = null; }
    };
  }, [fileUrl, isPDF, retryCount, renderPage]);

  useEffect(() => {
    if (!pdfDocRef.current || totalPages === 0 || loading) return;
    let active = true;
    setLoading(true);
    setLoadingMessage('Displaying PDF…');
    renderPage(pdfDocRef.current, currentPage, zoom).then(() => {
      if (active) setLoading(false);
    }).catch((cause: any) => {
      if (!active || cause?.name === 'RenderingCancelledException') return;
      console.error('PDF render failed:', cause);
      setError('Unable to display this PDF page. Please try again.');
      setLoading(false);
    });
    return () => { active = false; };
    // Initial page is rendered by the load effect; this handles page and pinch changes.
  }, [currentPage, zoom, renderPage]);

  const distance = (touches: TouchEvent<HTMLDivElement>['touches']) => Math.hypot(
    touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY
  );
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isPDF && e.touches.length === 2) {
      const d = distance(e.touches);
      pinchRef.current = { start: d, last: d, zoom };
    }
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (pinchRef.current && e.touches.length === 2) pinchRef.current.last = distance(e.touches);
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current || e.touches.length >= 2) return;
    const p = pinchRef.current;
    pinchRef.current = null;
    if (p.start > 0) {
      const next = Math.max(75, Math.min(300, Math.round(p.zoom * p.last / p.start)));
      if (Math.abs(next - zoom) >= 5) setZoom(next);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 pest-pdf-viewer"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Full-screen on mobile, contained on desktop */}
      <div className="flex flex-col w-full h-[100dvh] min-h-0 sm:max-w-5xl sm:h-[95vh] sm:rounded-xl bg-slate-800 border-0 sm:border border-slate-700 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isImage ? 'bg-green-600' : 'bg-red-600'}`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{title || fileName}</p>
            <p className="text-xs text-slate-400 hidden sm:block">{fileSize || 'Document'}</p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isPDF && !error && !loading && totalPages > 1 && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white text-xs sm:text-sm px-1 min-w-[48px] text-center">{currentPage}/{totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="w-px h-5 bg-slate-700 mx-0.5" />
              </>
            )}
            {!error && !loading && (
              <>
                {isImage && (
                  <Button variant="ghost" size="sm" onClick={() => setRotation(r => (r + 90) % 360)} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                )}
                <div className="w-px h-5 bg-slate-700 mx-0.5" />
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="flex-1 min-h-0 overflow-auto bg-slate-900 p-2 sm:p-6 pest-pdf-scroll">
          {loading && (
            <div className="w-full min-h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm">{loadingMessage}</p>
            </div>
          )}

          {!loading && error && (
            <div className="w-full min-h-full flex flex-col items-center justify-center gap-4 text-center px-5">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="text-white font-medium">Unable to open document</p>
              <p className="text-sm text-slate-400 max-w-sm">{error}</p>
              <Button onClick={() => setRetryCount(n => n + 1)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Try again
              </Button>
            </div>
          )}

          {isPDF && (
            <div className={`mx-auto w-max max-w-none shadow-2xl ${loading || error ? 'hidden' : ''}`} style={{ lineHeight: 0 }}>
              <canvas ref={canvasRef} className="pest-pdf-canvas" style={{ display: 'block', maxWidth: 'none' }} />
            </div>
          )}

          {!loading && !error && isImage && (
            <img
              src={fileUrl}
              alt={fileName}
              style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: 'top center', transition: 'transform 0.2s ease', maxWidth: '100%' }}
            />
          )}

          {!loading && !error && !isPDF && !isImage && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Unsupported file type — <button onClick={handleDownload} className="ml-1 text-blue-400 underline">download instead</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
