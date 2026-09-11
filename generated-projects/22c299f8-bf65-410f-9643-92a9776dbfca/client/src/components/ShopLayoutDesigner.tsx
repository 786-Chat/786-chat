import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Download,
  Send,
  Trash2,
  Type,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Upload,
  MousePointer,
  Square,
  Circle,
  Triangle,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Palette,
} from 'lucide-react';

interface LayoutElement {
  id: string;
  type: 'icon' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  content: string;
  style: {
    color: string;
    backgroundColor: string;
    fontSize?: number;
    fontWeight?: string;
  };
}

interface ShopLayoutDesignerProps {
  onSave: (layout: any) => void;
  onSendToBranch: (layout: any, branchId: string) => void;
  onSendToMyDocuments?: (layout: any) => void;
  branches: any[];
  initialData?: any;
  onClose?: () => void;
}

const PEST_ICONS = [
  { id: 'mouse', emoji: '🐭', label: 'Mouse' },
  { id: 'rat', emoji: '🐀', label: 'Rat' },
  { id: 'cockroach', emoji: '🪳', label: 'Cockroach' },
  { id: 'ant', emoji: '🐜', label: 'Ant' },
  { id: 'fly', emoji: '🪰', label: 'Fly' },
  { id: 'spider', emoji: '🕷️', label: 'Spider' },
];

const DEVICE_ICONS = [
  { id: 'poison-box', emoji: '🟦', label: 'Poison Box' },
  { id: 'mouse-trap', emoji: '🪤', label: 'Mouse Trap' },
  { id: 'monitoring', emoji: '📡', label: 'Monitor Device' },
  { id: 'camera', emoji: '📹', label: 'Camera' },
  { id: 'sensor', emoji: '📡', label: 'Sensor' },
  { id: 'bait-station', emoji: '🎯', label: 'Bait Station' },
];

const ROOM_ICONS = [
  { id: 'kitchen', emoji: '🍳', label: 'Kitchen' },
  { id: 'canopy-kitchen', emoji: '🏕️', label: 'Canopy Kitchen' },
  { id: 'storage', emoji: '📦', label: 'Storage' },
  { id: 'dining', emoji: '🍽️', label: 'Dining Area' },
  { id: 'entrance', emoji: '🚪', label: 'Entrance' },
  { id: 'bathroom', emoji: '🚿', label: 'Bathroom' },
  { id: 'toilet', emoji: '🚽', label: 'Toilet' },
  { id: 'office', emoji: '💼', label: 'Office' },
  { id: 'carpet', emoji: '🟫', label: 'Carpet' },
];

const ARCHITECTURAL_ICONS = [
  { id: 'window', emoji: '🪟', label: 'Window' },
  { id: 'door', emoji: '🚪', label: 'Door' },
  { id: 'front-door', emoji: '🚪', label: 'Front Door' },
  { id: 'back-door', emoji: '🚪', label: 'Back Door' },
  { id: 'wall', emoji: '🧱', label: 'Wall' },
];

const FURNITURE_ICONS = [
  { id: 'table', emoji: '🪑', label: 'Table' },
];

export default function ShopLayoutDesigner({ onSave, onSendToBranch, onSendToMyDocuments, branches, initialData, onClose }: ShopLayoutDesignerProps) {
  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'shape'>('select');
  const [zoom, setZoom] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 420, height: 594 });
  const [showGrid, setShowGrid] = useState(true);
  const [layoutTitle, setLayoutTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Button status states for visual feedback
  const [isSaved, setIsSaved] = useState(false);
  const [isSentToDocuments, setIsSentToDocuments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToDocuments, setIsSendingToDocuments] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true); // Auto-save enabled for convenience
  const [isDirty, setIsDirty] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Initialize with existing data if provided
  useEffect(() => {
    if (initialData) {
      setLayoutTitle(initialData.title || '');
      if (initialData.elements) {
        setElements(initialData.elements);
      }
      setIsSaved(true); // If we're editing existing data, it's already saved
    }
  }, [initialData]);

  // Auto-save when content changes (with debounce) - simplified to avoid infinite loops
  useEffect(() => {
    // Auto-save even without title - use default title if empty
    if (!autoSaveEnabled || elements.length === 0) return;
    
    // Mark as not saved when content changes
    setIsSaved(false);
    setIsDirty(true);
    
    const autoSaveTimer = setTimeout(async () => {
      if (!onSave) return;
      
      try {
        setIsSaving(true);
        const layoutData = {
          title: layoutTitle,
          elements: elements,
          dimensions: { width: 420, height: 594 },
          createdAt: new Date(),
        };
        
        const saveData = {
          ...layoutData,
          title: layoutTitle.trim() || `Layout ${new Date().toLocaleDateString()}`
        };
        
        console.log('💾 Auto-saving layout:', { title: saveData.title, elementCount: elements.length });
        await onSave(saveData);
        console.log('✅ Auto-save successful');
        setIsSaved(true);
        setIsDirty(false);
        
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        setIsSaved(false);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Auto-save after 1 second of no changes

    return () => {
      clearTimeout(autoSaveTimer);
    };
  }, [elements, layoutTitle, autoSaveEnabled, onSave]);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Update canvas dimensions based on viewport size
  useEffect(() => {
    const updateCanvasDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Mobile-first responsive canvas sizing
      if (viewportWidth < 640) { // Mobile
        setCanvasDimensions({
          width: Math.min(320, viewportWidth - 32),
          height: Math.min(450, viewportHeight - 200)
        });
      } else if (viewportWidth < 1024) { // Tablet
        setCanvasDimensions({
          width: Math.min(400, viewportWidth - 320),
          height: Math.min(565, viewportHeight - 200)
        });
      } else { // Desktop
        setCanvasDimensions({ width: 420, height: 594 });
      }
    };
    
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'icon' | 'text' | 'shape', content: string } | null>(null);
  const [isCanvasDropping, setIsCanvasDropping] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && (!e.target || (e.target as HTMLElement).tagName !== 'INPUT')) {
        e.preventDefault();
        deleteElement(selectedElement);
      }
      
      // Deselect with Escape key
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setIsDragging(false);
        setIsResizing(false);
      }
      
      // Copy element with Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElement) {
        e.preventDefault();
        const element = elements.find(el => el.id === selectedElement);
        if (element) {
          const newElement = {
            ...element,
            id: `element-${Date.now()}`,
            x: element.x + 10,
            y: element.y + 10,
          };
          setElements(prev => [...prev, newElement]);
          setSelectedElement(newElement.id);
        }
      }
      
      // Move element with arrow keys
      if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        
        setElements(prev => prev.map(el => {
          if (el.id !== selectedElement) return el;
          
          let newX = el.x;
          let newY = el.y;
          
          switch (e.key) {
            case 'ArrowUp':
              newY = Math.max(0, el.y - step);
              break;
            case 'ArrowDown':
              newY = Math.min(canvasDimensions.height - el.height, el.y + step);
              break;
            case 'ArrowLeft':
              newX = Math.max(0, el.x - step);
              break;
            case 'ArrowRight':
              newX = Math.min(canvasDimensions.width - el.width, el.x + step);
              break;
          }
          
          return { ...el, x: newX, y: newY };
        }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements, deleteElement]);

  const addElement = useCallback((type: 'icon' | 'text' | 'shape', content: string, x?: number, y?: number) => {
    const newElement: LayoutElement = {
      id: `element-${Date.now()}`,
      type,
      x: x !== undefined ? x : 100,
      y: y !== undefined ? y : 100,
      width: type === 'text' ? 100 : 40,
      height: type === 'text' ? 30 : 40,
      rotation: 0,
      flipX: false,
      flipY: false,
      content,
      style: {
        color: type === 'text' ? '#000000' : '#ffffff', // Black text on white canvas
        backgroundColor: type === 'shape' ? '#3b82f6' : 'transparent',
        fontSize: type === 'text' ? 14 : undefined,
        fontWeight: type === 'text' ? 'normal' : undefined,
      },
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, []);

  // Color change functions
  const updateElementColor = useCallback((elementId: string, color: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, style: { ...el.style, color } }
        : el
    ));
  }, []);

  const updateElementBackgroundColor = useCallback((elementId: string, backgroundColor: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, style: { ...el.style, backgroundColor } }
        : el
    ));
  }, []);

  // Flip functions
  const flipElement = useCallback((elementId: string, direction: 'horizontal' | 'vertical') => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { 
            ...el, 
            flipX: direction === 'horizontal' ? !el.flipX : el.flipX,
            flipY: direction === 'vertical' ? !el.flipY : el.flipY
          }
        : el
    ));
  }, []);

  // Rotation functions
  const rotateElement = useCallback((elementId: string, direction: 'left' | 'right') => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, rotation: el.rotation + (direction === 'right' ? 90 : -90) }
        : el
    ));
  }, []);

  // Size change functions
  const resizeElement = useCallback((elementId: string, direction: 'bigger' | 'smaller') => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { 
            ...el, 
            width: direction === 'bigger' ? Math.min(el.width + 10, 200) : Math.max(el.width - 10, 20),
            height: direction === 'bigger' ? Math.min(el.height + 10, 200) : Math.max(el.height - 10, 20)
          }
        : el
    ));
  }, []);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (tool !== 'select') return;
    
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - element.x * zoom,
          y: e.clientY - rect.top - element.y * zoom,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      handleResizeMove(e);
      return;
    }
    
    if (!isDragging || !selectedElement) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const selectedEl = elements.find(el => el.id === selectedElement);
      const newX = Math.max(0, Math.min((e.clientX - rect.left - dragOffset.x) / zoom, canvasDimensions.width - (selectedEl?.width || 40)));
      const newY = Math.max(0, Math.min((e.clientY - rect.top - dragOffset.y) / zoom, canvasDimensions.height - (selectedEl?.height || 40)));
      
      setElements(prev => prev.map(el => 
        el.id === selectedElement ? { ...el, x: newX, y: newY } : el
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'icon' | 'text' | 'shape', content: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, content }));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedItem({ type, content });
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.padding = '8px';
    dragImage.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
    dragImage.style.color = 'white';
    dragImage.style.borderRadius = '4px';
    dragImage.style.fontSize = '12px';
    dragImage.innerHTML = content === 'rectangle' ? '□' : content === 'circle' ? '○' : content;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsCanvasDropping(false);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCanvasDropping(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    // Only hide drop indicator if leaving canvas bounds
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsCanvasDropping(false);
      }
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCanvasDropping(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (rect && data.type && data.content) {
        const x = Math.max(0, Math.min((e.clientX - rect.left) / zoom - 20, (canvasDimensions.width - 40)));
        const y = Math.max(0, Math.min((e.clientY - rect.top) / zoom - 20, (canvasDimensions.height - 40)));
        
        addElement(data.type, data.content, x, y);
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - element.x * zoom,
          y: e.clientY - rect.top - element.y * zoom,
        });
      }
    }
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !selectedElement || !resizeHandle) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    
    setElements(prev => prev.map(el => {
      if (el.id !== selectedElement) return el;
      
      let newWidth = el.width;
      let newHeight = el.height;
      let newX = el.x;
      let newY = el.y;
      
      switch (resizeHandle) {
        case 'se': // Southeast corner
          newWidth = Math.max(20, mouseX - el.x);
          newHeight = Math.max(20, mouseY - el.y);
          break;
        case 'sw': // Southwest corner
          newWidth = Math.max(20, el.x + el.width - mouseX);
          newHeight = Math.max(20, mouseY - el.y);
          newX = Math.min(el.x, mouseX);
          break;
        case 'ne': // Northeast corner
          newWidth = Math.max(20, mouseX - el.x);
          newHeight = Math.max(20, el.y + el.height - mouseY);
          newY = Math.min(el.y, mouseY);
          break;
        case 'nw': // Northwest corner
          newWidth = Math.max(20, el.x + el.width - mouseX);
          newHeight = Math.max(20, el.y + el.height - mouseY);
          newX = Math.min(el.x, mouseX);
          newY = Math.min(el.y, mouseY);
          break;
      }
      
      // Ensure element stays within canvas bounds
      newX = Math.max(0, Math.min(newX, canvasDimensions.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasDimensions.height - newHeight));
      newWidth = Math.min(newWidth, canvasDimensions.width - newX);
      newHeight = Math.min(newHeight, canvasDimensions.height - newY);
      
      return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
    }));
  };


  const exportLayout = () => {
    const layoutData = {
      title: layoutTitle,
      elements,
      dimensions: canvasDimensions, // Current responsive dimensions
      createdAt: new Date(),
    };
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(layoutData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layoutTitle || 'shop-layout'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendToBranch = () => {
    if (!selectedBranch) return;
    
    const layoutData = {
      title: layoutTitle,
      elements,
      branchId: selectedBranch,
      createdAt: new Date(),
    };
    
    onSendToBranch(layoutData, selectedBranch);
  };

  const sendToMyDocuments = async () => {
    if (!layoutTitle.trim()) {
      alert('Please enter a layout title before sending to documents');
      return;
    }
    
    setIsSendingToDocuments(true);
    
    try {
      const layoutData = {
        title: layoutTitle,
        elements,
        createdAt: new Date(),
      };
      
      if (onSendToMyDocuments) {
        await onSendToMyDocuments(layoutData);
        setIsSentToDocuments(true);
        
        // Reset the sent status after 3 seconds to show it's ready for more changes
        setTimeout(() => {
          setIsSentToDocuments(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Send to documents failed:', error);
      alert('Failed to send to documents. Please try again.');
    } finally {
      setIsSendingToDocuments(false);
    }
  };

  const saveLayout = async () => {
    if (!layoutTitle.trim()) {
      alert('Please enter a layout title before saving');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const layoutData = {
        title: layoutTitle,
        layoutData: {
          elements,
          dimensions: canvasDimensions, // Responsive dimensions
          zoom,
          showGrid,
        },
        createdAt: new Date(),
      };
      
      await onSave(layoutData);
      setIsSaved(true);
      
      // With auto-save enabled, keep the saved status longer
      if (autoSaveEnabled) {
        // Keep saved status for auto-save mode
        setTimeout(() => {
          setIsSaved(prev => prev);
        }, 2000);
      } else {
        // Reset after 3 seconds if auto-save is disabled
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save layout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-2 sm:p-4">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            <Input
              placeholder="Layout Title (e.g., Milano Pizza Floor Plan)"
              value={layoutTitle}
              onChange={(e) => setLayoutTitle(e.target.value)}
              className="w-full sm:w-64 bg-slate-700 border-slate-600 text-white"
              data-testid="layout-title-input"
            />
            
            {/* Save and Send buttons in top area */}
            <Button
              size="sm"
              onClick={saveLayout}
              disabled={!layoutTitle.trim()}
              className={`transition-colors h-12 sm:h-8 touch-manipulation ${
                isSaving 
                  ? "bg-gray-500 hover:bg-gray-500" 
                  : isSaved 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
              data-testid="button-save-layout"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            
            {/* Show Send to My Documents only when NOT in admin view (branches array is empty) */}
            {(!branches || branches.length === 0) && onSendToMyDocuments && (
              <Button
                size="sm"
                onClick={sendToMyDocuments}
                disabled={!layoutTitle.trim()}
                className={`transition-colors h-12 sm:h-8 touch-manipulation ${
                  isSendingToDocuments 
                    ? "bg-gray-500 hover:bg-gray-500" 
                    : isSentToDocuments 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
                data-testid="button-send-to-documents"
              >
                {isSendingToDocuments ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={tool === 'select' ? 'default' : 'outline'}
                onClick={() => setTool('select')}
                className="border-slate-600 h-12 sm:h-8 touch-manipulation"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={tool === 'text' ? 'default' : 'outline'}
                onClick={() => setTool('text')}
                className="border-slate-600 h-12 sm:h-8 touch-manipulation"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={showGrid ? 'default' : 'outline'}
                onClick={() => setShowGrid(!showGrid)}
                className="border-slate-600 h-12 sm:h-8 touch-manipulation"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="border-slate-600 h-12 sm:h-8 touch-manipulation"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="border-slate-600 h-12 sm:h-8 touch-manipulation"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2 w-full sm:w-auto">
            {/* Show branch selection only when branches array has items (admin view) */}
            {branches && branches.length > 0 && (
              <>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-full sm:w-48 h-12 sm:h-8 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select branch to send" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  onClick={sendToBranch}
                  disabled={!selectedBranch || !layoutTitle}
                  className="bg-green-600 hover:bg-green-700 h-12 sm:h-8 touch-manipulation w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Send to Branch</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              onClick={exportLayout}
              variant="outline"
              className="border-slate-600 h-12 sm:h-8 touch-manipulation w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Icon Palette */}
        <div className="w-full sm:w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto max-h-64 sm:max-h-none">
          <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            {/* Pest Icons */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Pest Types</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {PEST_ICONS.map((icon) => (
                  <Button
                    key={icon.id}
                    size="sm"
                    variant="outline"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'icon', icon.emoji)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addElement('icon', icon.emoji)}
                    className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                    data-testid={`drag-pest-${icon.id}`}
                  >
                    <span className="text-lg sm:text-lg">{icon.emoji}</span>
                    <span className="text-xs text-slate-400 truncate w-full px-1">{icon.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Device Icons */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Control Devices</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {DEVICE_ICONS.map((icon) => (
                  <Button
                    key={icon.id}
                    size="sm"
                    variant="outline"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'icon', icon.emoji)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addElement('icon', icon.emoji)}
                    className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                    data-testid={`drag-device-${icon.id}`}
                  >
                    <span className="text-lg sm:text-lg">{icon.emoji}</span>
                    <span className="text-xs text-slate-400 truncate w-full px-1">{icon.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Room Icons */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Room Areas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {ROOM_ICONS.map((icon) => (
                  <Button
                    key={icon.id}
                    size="sm"
                    variant="outline"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'icon', icon.emoji)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addElement('icon', icon.emoji)}
                    className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                    data-testid={`drag-room-${icon.id}`}
                  >
                    <span className="text-lg sm:text-lg">{icon.emoji}</span>
                    <span className="text-xs text-slate-400 truncate w-full px-1">{icon.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Architectural Icons */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Architectural Elements</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {ARCHITECTURAL_ICONS.map((icon) => (
                  <Button
                    key={icon.id}
                    size="sm"
                    variant="outline"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'icon', icon.emoji)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addElement('icon', icon.emoji)}
                    className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                    data-testid={`drag-architectural-${icon.id}`}
                  >
                    <span className="text-lg sm:text-lg">{icon.emoji}</span>
                    <span className="text-xs text-slate-400 truncate w-full px-1">{icon.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Furniture Icons */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Furniture</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {FURNITURE_ICONS.map((icon) => (
                  <Button
                    key={icon.id}
                    size="sm"
                    variant="outline"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'icon', icon.emoji)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addElement('icon', icon.emoji)}
                    className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                    data-testid={`drag-furniture-${icon.id}`}
                  >
                    <span className="text-lg sm:text-lg">{icon.emoji}</span>
                    <span className="text-xs text-slate-400 truncate w-full px-1">{icon.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Shapes */}
            <div>
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Shapes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'shape', 'rectangle')}
                  onDragEnd={handleDragEnd}
                  onClick={() => addElement('shape', 'rectangle')}
                  className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                  data-testid="drag-rectangle"
                >
                  <Square className="h-4 w-4" />
                  <span className="text-xs text-slate-400 truncate w-full px-1">Rectangle</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'shape', 'circle')}
                  onDragEnd={handleDragEnd}
                  onClick={() => addElement('shape', 'circle')}
                  className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                  data-testid="drag-circle"
                >
                  <Circle className="h-4 w-4" />
                  <span className="text-xs text-slate-400 truncate w-full px-1">Circle</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'text', 'Text Label')}
                  onDragEnd={handleDragEnd}
                  onClick={() => addElement('text', 'Text Label')}
                  className="h-14 sm:h-12 border-slate-600 hover:bg-slate-700 flex flex-col cursor-grab active:cursor-grabbing touch-manipulation min-w-0"
                  data-testid="drag-text"
                >
                  <Type className="h-4 w-4" />
                  <span className="text-xs text-slate-400 truncate w-full px-1">Text</span>
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="hidden sm:block">
              <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">How to Use</h3>
              <div className="text-xs text-slate-400 space-y-1 sm:space-y-2">
                <p>• <strong>Drag & Drop:</strong> Drag shapes from library to canvas</p>
                <p>• <strong>Move:</strong> Click and drag elements on canvas</p>
                <p>• <strong>Resize:</strong> Hover over selected element to see resize handles</p>
                <p>• <strong>Select:</strong> Click elements to select them</p>
                <p>• <strong>Delete:</strong> Press Delete/Backspace key or use button below</p>
                <p>• <strong>Duplicate:</strong> Ctrl+C to copy selected element</p>
                <p>• <strong>Move precisely:</strong> Arrow keys (+ Shift for 10px steps)</p>
                <p>• <strong>Deselect:</strong> Press Escape key</p>
              </div>
            </div>

            {/* Element Properties */}
            {selectedElement && (() => {
              const element = elements.find(el => el.id === selectedElement);
              if (!element) return null;
              
              return (
                <div>
                  <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Element Controls</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {/* Element Info */}
                    <div className="text-xs text-slate-400">
                      Type: {element.type} | ID: {selectedElement.substring(0, 8)}...
                    </div>

                    {/* Size Controls */}
                    <div>
                      <div className="text-xs text-slate-300 mb-1 sm:mb-2">Size</div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resizeElement(selectedElement, 'smaller')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="size-smaller"
                        >
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resizeElement(selectedElement, 'bigger')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="size-bigger"
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Flip Controls */}
                    <div>
                      <div className="text-xs text-slate-300 mb-1 sm:mb-2">Flip</div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => flipElement(selectedElement, 'horizontal')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="flip-horizontal"
                        >
                          <FlipHorizontal className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => flipElement(selectedElement, 'vertical')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="flip-vertical"
                        >
                          <FlipVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Rotation Controls */}
                    <div>
                      <div className="text-xs text-slate-300 mb-1 sm:mb-2">Rotate</div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateElement(selectedElement, 'left')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="rotate-left"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateElement(selectedElement, 'right')}
                          className="flex-1 h-10 sm:h-8 border-slate-600 hover:bg-slate-700 touch-manipulation"
                          data-testid="rotate-right"
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Color Controls */}
                    <div>
                      <div className="text-xs text-slate-300 mb-2">Colors</div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Text Color</label>
                          <div className="flex gap-1">
                            {['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'].map(color => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-slate-500 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => updateElementColor(selectedElement, color)}
                                data-testid={`color-${color.replace('#', '')}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Background</label>
                          <div className="flex gap-1">
                            {['transparent', '#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b'].map(color => (
                              <button
                                key={color}
                                className="w-6 h-6 rounded border border-slate-500 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                                onClick={() => updateElementBackgroundColor(selectedElement, color)}
                                data-testid={`bg-color-${color.replace('#', '')}`}
                              >
                                {color === 'transparent' && <div className="w-full h-full bg-slate-700 rounded" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteElement(selectedElement)}
                      className="w-full h-12 sm:h-8 border-red-600 text-red-400 hover:bg-red-600/20 touch-manipulation"
                      data-testid="delete-element-button"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Element
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-900 overflow-hidden">
          <div className="w-full h-full flex items-start justify-center p-2 sm:p-8 pt-8">
            <div
              ref={canvasRef}
              className={`relative bg-white shadow-2xl transition-colors duration-200 max-w-full max-h-full ${
                isCanvasDropping ? 'ring-4 ring-blue-400 ring-opacity-50 bg-blue-50' : ''
              }`}
              style={{
                width: canvasDimensions.width * zoom,
                height: canvasDimensions.height * zoom,
                minWidth: 280, // Minimum width for mobile
                minHeight: 400, // Minimum height for mobile
                backgroundImage: showGrid ? 
                  `radial-gradient(circle, #e2e8f0 1px, transparent 1px)` : 
                  'none',
                backgroundSize: showGrid ? `${20 * zoom}px ${20 * zoom}px` : 'auto',
                touchAction: 'manipulation', // Better mobile touch handling
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDragOver={handleCanvasDragOver}
              onDragEnter={handleCanvasDragEnter}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
              data-testid="canvas-drop-zone"
            >
              {/* Layout Title */}
              {layoutTitle && (
                <div
                  className="absolute top-4 left-4 text-slate-800 font-bold"
                  style={{ fontSize: 16 * zoom }}
                >
                  {layoutTitle}
                </div>
              )}

              {/* Elements */}
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute group ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                  } ${
                    isDragging && selectedElement === element.id ? 'cursor-grabbing' : 'cursor-pointer hover:ring-1 hover:ring-blue-300'
                  }`}
                  style={{
                    left: element.x * zoom,
                    top: element.y * zoom,
                    width: element.width * zoom,
                    height: element.height * zoom,
                    transform: `rotate(${element.rotation}deg) scaleX(${element.flipX ? -1 : 1}) scaleY(${element.flipY ? -1 : 1})`,
                    color: element.style.color,
                    backgroundColor: element.style.backgroundColor,
                    fontSize: element.style.fontSize ? element.style.fontSize * zoom : undefined,
                    fontWeight: element.style.fontWeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  data-testid={`canvas-element-${element.id}`}
                >
                  {element.type === 'text' ? (
                    <span
                      contentEditable={editingTextId === element.id}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingTextId(element.id);
                      }}
                      onMouseDown={(e) => {
                        if (editingTextId === element.id) {
                          e.stopPropagation();
                        }
                      }}
                      onBlur={(e) => {
                        const newText = e.currentTarget?.textContent || e.target?.textContent || 'Text';
                        setEditingTextId(null);
                        setElements(prev => prev.map(el => 
                          el.id === element.id 
                            ? { ...el, content: newText }
                            : el
                        ));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const newText = e.currentTarget?.textContent || e.target?.textContent || 'Text';
                          setEditingTextId(null);
                          setElements(prev => prev.map(el => 
                            el.id === element.id 
                              ? { ...el, content: newText }
                              : el
                          ));
                        }
                        if (e.key === 'Escape') {
                          setEditingTextId(null);
                        }
                      }}
                      className={editingTextId === element.id ? 'outline-none border-2 border-blue-400 px-1 bg-white' : ''}
                      style={{ userSelect: editingTextId === element.id ? 'text' : 'none', cursor: editingTextId === element.id ? 'text' : 'inherit' }}
                    >
                      {element.content}
                    </span>
                  ) : element.type === 'icon' ? (
                    <span style={{ fontSize: 24 * zoom }}>{element.content}</span>
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        borderRadius: element.content === 'circle' ? '50%' : '0',
                      }}
                    />
                  )}
                  
                  {/* Resize Handles */}
                  {selectedElement === element.id && tool === 'select' && (
                    <>
                      {/* Corner resize handles */}
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ transform: `rotate(-${element.rotation}deg)` }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                        data-testid={`resize-handle-nw-${element.id}`}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ transform: `rotate(-${element.rotation}deg)` }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                        data-testid={`resize-handle-ne-${element.id}`}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ transform: `rotate(-${element.rotation}deg)` }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                        data-testid={`resize-handle-sw-${element.id}`}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ transform: `rotate(-${element.rotation}deg)` }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                        data-testid={`resize-handle-se-${element.id}`}
                      />
                    </>
                  )}
                </div>
              ))}

              {/* Drop Zone Indicator */}
              {isCanvasDropping && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg opacity-75">
                    Drop shape here
                  </div>
                </div>
              )}
              
              {/* Guidelines */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-slate-600 text-xs hidden sm:block">
                Size: {canvasDimensions.width} × {canvasDimensions.height} px
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}