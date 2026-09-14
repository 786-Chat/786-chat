import { useState, useEffect } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  file: {
    id: string;
    filename: string;
    type: string;
    url?: string;
    category: string;
    title: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // MOBILE DETECTION AND CACHE-BUSTING for mobile document visibility
  const [isMobile, setIsMobile] = useState(false);
  const [cacheBustTimestamp, setCacheBustTimestamp] = useState(Date.now());
  
  useEffect(() => {
    // Detect mobile device
    const userAgent = navigator.userAgent || '';
    const mobileDetected = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobileDetected);
    
    // Force cache refresh for mobile devices
    if (mobileDetected) {
      setCacheBustTimestamp(Date.now());
      console.log(`📱 Mobile FileViewer opened for ${file.filename}, cache-busting enabled`);
    }
  }, [file.filename]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleDownload = () => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = getMobileOptimizedUrl(file.url);
      link.download = file.filename;
      link.click();
    }
  };

  // MOBILE-OPTIMIZED URL generation with cache-busting
  const getMobileOptimizedUrl = (baseUrl: string) => {
    if (isMobile) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}_t=${cacheBustTimestamp}&mobile=1`;
    }
    return baseUrl;
  };

  const getFileType = (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension || 'unknown';
  };

  const renderFileContent = () => {
    const fileType = getFileType(file.filename);
    const fileUrl = file.url || `/api/files/${file.id}`;

    switch (fileType) {
      case 'pdf':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">
              <div 
                className="flex justify-center items-center h-full p-4"
                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
              >
                <iframe
                  src={`${fileUrl}#page=${currentPage}&view=FitH`}
                  className="w-full h-full border-0 bg-white rounded-lg shadow-lg"
                  title={file.title}
                />
              </div>
            </div>
          </div>
        );

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
      case 'bmp':
      case 'tiff':
        return (
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div 
              className="max-w-full max-h-full p-4"
              style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
            >
              <img
                src={getMobileOptimizedUrl(fileUrl)}
                alt={file.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log(`✅ Mobile FileViewer image loaded: ${file.filename}, Mobile: ${isMobile}, Size: ${img.naturalWidth}x${img.naturalHeight}`);
                  if (img.naturalWidth && img.naturalHeight) {
                    // For images, we can calculate aspect ratio for better display
                  }
                }}
                onError={(e) => {
                  console.error(`❌ Mobile FileViewer image failed: ${file.filename}, trying fallbacks...`);
                  const img = e.target as HTMLImageElement;
                  
                  // MOBILE-OPTIMIZED fallback paths
                  const fallbackPaths = [
                    getMobileOptimizedUrl(`/uploads/${file.filename}`),
                    getMobileOptimizedUrl(`/attached_assets/${file.filename}`),
                    getMobileOptimizedUrl(`/api/smart-image/${file.filename}`),
                    `/data/photos/${file.filename}?_t=${cacheBustTimestamp}`,
                    `/data/documents/${file.filename}?_t=${cacheBustTimestamp}`,
                    `/backup/photos/${file.filename}?_t=${cacheBustTimestamp}`
                  ];
                  
                  const tryCount = parseInt(img.dataset.tryCount || '0');
                  const nextPath = fallbackPaths[tryCount];
                  
                  if (nextPath && tryCount < fallbackPaths.length) {
                    console.log(`📱 FileViewer fallback ${tryCount + 1}/${fallbackPaths.length}: ${nextPath}`);
                    img.src = nextPath;
                    img.dataset.tryCount = (tryCount + 1).toString();
                  } else {
                    console.error(`❌ FileViewer mobile image completely failed: ${file.filename} after ${fallbackPaths.length} attempts`);
                    // Replace with mobile-friendly error message
                    img.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center min-h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-600';
                    errorDiv.innerHTML = `
                      <div class="text-center p-6">
                        <div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span class="text-gray-500 text-xl">📄</span>
                        </div>
                        <h3 class="text-gray-700 dark:text-gray-300 text-base font-medium mb-1">Document Unavailable</h3>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">${file.filename}</p>
                        <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Mobile: ${isMobile ? 'Yes' : 'No'} • Attempts: ${fallbackPaths.length}</p>
                      </div>
                    `;
                    img.parentNode?.appendChild(errorDiv);
                  }
                }}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-2">Preview not available</p>
              <p className="text-sm text-gray-500">File type: {fileType.toUpperCase()}</p>
              <Button onClick={handleDownload} className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-700">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {file.title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderFileContent()}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500">
            <span className="font-medium">{file.filename}</span>
            <span className="mx-2">•</span>
            <span>{file.category}</span>
          </div>
          <div className="text-sm text-gray-500">
            Type: {getFileType(file.filename).toUpperCase()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}