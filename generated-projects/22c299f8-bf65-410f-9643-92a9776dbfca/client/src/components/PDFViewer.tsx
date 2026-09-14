import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const loadTaskRef = useRef<any>(null);

  const ext = fileName.toLowerCase().split('.').pop() || '';
  const isPDF = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);

  const renderPage = useCallback(async (doc: any, pageNum: number, scale: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 * (scale / 100) });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return;
      console.error('Render error:', err);
    }
  }, []);

  useEffect(() => {
    if (!isPDF) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);

    if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
    if (loadTaskRef.current) { loadTaskRef.current.destroy().catch(() => {}); loadTaskRef.current = null; }
    if (pdfDocRef.current) { pdfDocRef.current.destroy().catch(() => {}); pdfDocRef.current = null; }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }

    const task = pdfjsLib.getDocument({ url: fileUrl, withCredentials: true });
    loadTaskRef.current = task;

    task.promise.then(doc => {
      if (loadTaskRef.current !== task) return;
      pdfDocRef.current = doc;
      setTotalPages(doc.numPages);
      setLoading(false);
      renderPage(doc, 1, zoom);
    }).catch(err => {
      if (err?.name === 'AbortException') return;
      setError('Could not load this PDF.');
      setLoading(false);
    });

    return () => {
      if (loadTaskRef.current === task) {
        task.destroy().catch(() => {});
        loadTaskRef.current = null;
      }
    };
  }, [fileUrl, isPDF]);

  useEffect(() => {
    if (pdfDocRef.current && totalPages > 0) {
      renderPage(pdfDocRef.current, currentPage, zoom);
    }
  }, [currentPage, zoom, totalPages, renderPage]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Full-screen on mobile, contained on desktop */}
      <div className="flex flex-col w-full h-full sm:max-w-5xl sm:h-[95vh] sm:rounded-xl bg-slate-800 border-0 sm:border border-slate-700 shadow-2xl overflow-hidden">

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
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(50, z - 25))} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-xs hidden sm:inline-block w-10 text-center">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 25))} className="text-white hover:bg-slate-700 h-9 w-9 p-0">
                  <ZoomIn className="w-4 h-4" />
                </Button>
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
        <div className="flex-1 overflow-auto bg-slate-900 flex items-start justify-center p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm">Loading document…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center max-w-xs">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="text-white font-medium">File not available</p>
              <p className="text-sm text-slate-400">This document could not be found. The file may have been deleted or not uploaded correctly. Please ask your administrator to re-upload it.</p>
            </div>
          )}

          {!loading && !error && isPDF && (
            <div className="shadow-2xl" style={{ lineHeight: 0 }}>
              <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
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
