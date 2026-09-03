import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  Plus,
  X,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterHorizontal,
  RotateCw,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Pentagon,
  ArrowRight,
  Minus,
  Diamond,
  Heart,
  Image as ImageIcon,
  MousePointer,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from "lucide-react";

interface CanvasElement {
  id: string;
  type: "rect" | "circle" | "triangle" | "star" | "hexagon" | "pentagon" | "diamond" | "heart" | "arrow" | "line" | "line-dashed" | "line-arrow" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  imageSrc?: string;
  label: string;
}

let idCounter = 0;
const genId = () => `el_${++idCounter}_${Date.now()}`;

const CANVAS_W = 800;
const CANVAS_H = 600;

function drawShape(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  if (!el.visible) return;
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
  ctx.rotate((el.rotation * Math.PI) / 180);
  const w = el.width, h = el.height;
  const hw = w / 2, hh = h / 2;

  ctx.fillStyle = el.color;
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;

  switch (el.type) {
    case "rect":
      ctx.beginPath();
      ctx.rect(-hw, -hh, w, h);
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    case "circle":
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(-hw, hh);
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    case "star": {
      const spikes = 5, outerR = Math.min(hw, hh), innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    }
    case "hexagon": {
      const r = Math.min(hw, hh);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    }
    case "pentagon": {
      const r = Math.min(hw, hh);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    }
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, 0);
      ctx.lineTo(0, hh);
      ctx.lineTo(-hw, 0);
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    case "heart": {
      ctx.beginPath();
      const topY = -hh * 0.4;
      ctx.moveTo(0, hh);
      ctx.bezierCurveTo(-hw * 1.2, hh * 0.1, -hw * 1.2, topY - hh * 0.3, 0, topY);
      ctx.bezierCurveTo(hw * 1.2, topY - hh * 0.3, hw * 1.2, hh * 0.1, 0, hh);
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    }
    case "arrow":
      ctx.beginPath();
      ctx.moveTo(-hw, hh * 0.3);
      ctx.lineTo(hw * 0.3, hh * 0.3);
      ctx.lineTo(hw * 0.3, hh);
      ctx.lineTo(hw, 0);
      ctx.lineTo(hw * 0.3, -hh);
      ctx.lineTo(hw * 0.3, -hh * 0.3);
      ctx.lineTo(-hw, -hh * 0.3);
      ctx.closePath();
      ctx.fill();
      if (el.strokeWidth > 0) ctx.stroke();
      break;
    case "line":
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(hw, 0);
      ctx.strokeStyle = el.color;
      ctx.lineWidth = Math.max(el.strokeWidth, 3);
      ctx.stroke();
      break;
    case "line-dashed":
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(hw, 0);
      ctx.strokeStyle = el.color;
      ctx.lineWidth = Math.max(el.strokeWidth, 3);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case "line-arrow":
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(hw - 12, 0);
      ctx.strokeStyle = el.color;
      ctx.lineWidth = Math.max(el.strokeWidth, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hw, 0);
      ctx.lineTo(hw - 16, -8);
      ctx.lineTo(hw - 16, 8);
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();
      break;
    case "image":
      break;
  }
  ctx.restore();
}

export default function CanvasEditor() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [sidePanel, setSidePanel] = useState<"shapes" | "position" | "layers">("shapes");
  const [positionTab, setPositionTab] = useState<"arrange" | "layers">("arrange");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; elX: number; elY: number; elW: number; elH: number; resizing: string | null } | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const selected = elements.find((e) => e.id === selectedId) || null;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const el of elements) {
      if (!el.visible) continue;
      if (el.type === "image" && el.imageSrc) {
        let img = imageCache.current.get(el.imageSrc);
        if (img && img.complete) {
          ctx.save();
          ctx.globalAlpha = el.opacity;
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
          ctx.restore();
        } else if (!img) {
          const newImg = new Image();
          newImg.onload = () => renderCanvas();
          newImg.src = el.imageSrc;
          imageCache.current.set(el.imageSrc, newImg);
        }
      } else {
        drawShape(ctx, el);
      }
    }

    if (selected) {
      ctx.save();
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.translate(selected.x + selected.width / 2, selected.y + selected.height / 2);
      ctx.rotate((selected.rotation * Math.PI) / 180);
      ctx.strokeRect(-selected.width / 2 - 4, -selected.height / 2 - 4, selected.width + 8, selected.height + 8);
      ctx.setLineDash([]);

      const handleSize = 8;
      const handles = [
        { x: -selected.width / 2 - 4, y: -selected.height / 2 - 4, cursor: "nw" },
        { x: selected.width / 2 + 4, y: -selected.height / 2 - 4, cursor: "ne" },
        { x: -selected.width / 2 - 4, y: selected.height / 2 + 4, cursor: "sw" },
        { x: selected.width / 2 + 4, y: selected.height / 2 + 4, cursor: "se" },
      ];
      handles.forEach((h) => {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = 2;
        ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      });
      ctx.restore();
    }
  }, [elements, selectedId, bgColor, selected]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const hitTest = (px: number, py: number): string | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!el.visible || el.locked) continue;
      if (px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height) {
        return el.id;
      }
    }
    return null;
  };

  const getResizeHandle = (px: number, py: number): string | null => {
    if (!selected) return null;
    const margin = 10;
    const corners = [
      { name: "nw", x: selected.x, y: selected.y },
      { name: "ne", x: selected.x + selected.width, y: selected.y },
      { name: "sw", x: selected.x, y: selected.y + selected.height },
      { name: "se", x: selected.x + selected.width, y: selected.y + selected.height },
    ];
    for (const c of corners) {
      if (Math.abs(px - c.x) < margin && Math.abs(py - c.y) < margin) return c.name;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const handle = getResizeHandle(pos.x, pos.y);
    if (handle && selected) {
      dragRef.current = { startX: pos.x, startY: pos.y, elX: selected.x, elY: selected.y, elW: selected.width, elH: selected.height, resizing: handle };
      return;
    }
    const hitId = hitTest(pos.x, pos.y);
    setSelectedId(hitId);
    if (hitId) {
      const el = elements.find((e) => e.id === hitId)!;
      dragRef.current = { startX: pos.x, startY: pos.y, elX: el.x, elY: el.y, elW: el.width, elH: el.height, resizing: null };
      setSidePanel("position");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !selectedId) return;
    const pos = getCanvasPos(e);
    const dx = pos.x - dragRef.current.startX;
    const dy = pos.y - dragRef.current.startY;
    const { elX, elY, elW, elH } = dragRef.current;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;
        if (dragRef.current!.resizing) {
          const handle = dragRef.current!.resizing;
          let newX = elX, newY = elY, newW = elW, newH = elH;
          if (handle === "se") {
            newW = Math.max(20, elW + dx);
            newH = Math.max(20, elH + dy);
          } else if (handle === "sw") {
            newX = elX + dx;
            newW = Math.max(20, elW - dx);
            newH = Math.max(20, elH + dy);
          } else if (handle === "ne") {
            newW = Math.max(20, elW + dx);
            newY = elY + dy;
            newH = Math.max(20, elH - dy);
          } else if (handle === "nw") {
            newX = elX + dx;
            newY = elY + dy;
            newW = Math.max(20, elW - dx);
            newH = Math.max(20, elH - dy);
          }
          return { ...el, x: newX, y: newY, width: newW, height: newH };
        }
        return { ...el, x: elX + dx, y: elY + dy };
      })
    );
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const addShape = (type: CanvasElement["type"], label: string) => {
    const newEl: CanvasElement = {
      id: genId(),
      type,
      x: CANVAS_W / 2 - 50,
      y: CANVAS_H / 2 - 50,
      width: type.startsWith("line") ? 200 : 100,
      height: type.startsWith("line") ? 6 : 100,
      rotation: 0,
      color: "#000000",
      strokeColor: "#000000",
      strokeWidth: 0,
      opacity: 1,
      locked: false,
      visible: true,
      label,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setSidePanel("position");
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!ev.target?.result) return;
      const src = ev.target.result as string;
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(300 / img.width, 300 / img.height, 1);
        const newEl: CanvasElement = {
          id: genId(),
          type: "image",
          x: CANVAS_W / 2 - (img.width * scale) / 2,
          y: CANVAS_H / 2 - (img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
          rotation: 0,
          color: "transparent",
          strokeColor: "#000000",
          strokeWidth: 0,
          opacity: 1,
          locked: false,
          visible: true,
          imageSrc: src,
          label: "Image",
        };
        imageCache.current.set(src, img);
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
        setSidePanel("position");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateEl = (id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteEl = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateEl = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 20, y: el.y + 20, label: el.label + " copy" };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const moveLayer = (id: string, direction: "up" | "down" | "top" | "bottom") => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      if (direction === "up" && idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      } else if (direction === "down" && idx > 0) {
        [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      } else if (direction === "top") {
        const [item] = arr.splice(idx, 1);
        arr.push(item);
      } else if (direction === "bottom") {
        const [item] = arr.splice(idx, 1);
        arr.unshift(item);
      }
      return arr;
    });
  };

  const alignElement = (alignment: string) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;
        switch (alignment) {
          case "top": return { ...el, y: 0 };
          case "bottom": return { ...el, y: CANVAS_H - el.height };
          case "left": return { ...el, x: 0 };
          case "right": return { ...el, x: CANVAS_W - el.width };
          case "middle": return { ...el, y: (CANVAS_H - el.height) / 2 };
          case "centre": return { ...el, x: (CANVAS_W - el.width) / 2 };
          default: return el;
        }
      })
    );
  };

  const handleDownload = () => {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const el of elements) {
      if (!el.visible) continue;
      if (el.type === "image" && el.imageSrc) {
        const img = imageCache.current.get(el.imageSrc);
        if (img && img.complete) {
          ctx.save();
          ctx.globalAlpha = el.opacity;
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
          ctx.restore();
        }
      } else {
        drawShape(ctx, el);
      }
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `canvas-design-${Date.now()}.png`;
    link.click();
    toast({ title: "Downloaded!", description: "Your design has been saved" });
  };

  const shapeCategories = [
    {
      title: "Lines",
      items: [
        { type: "line" as const, label: "Solid Line", icon: <Minus className="h-8 w-8" /> },
        { type: "line-dashed" as const, label: "Dashed Line", icon: <span className="text-lg tracking-[4px]">---</span> },
        { type: "line-arrow" as const, label: "Arrow Line", icon: <ArrowRight className="h-8 w-8" /> },
      ],
    },
    {
      title: "Basic Shapes",
      items: [
        { type: "rect" as const, label: "Rectangle", icon: <Square className="h-8 w-8" /> },
        { type: "circle" as const, label: "Circle", icon: <Circle className="h-8 w-8" /> },
        { type: "triangle" as const, label: "Triangle", icon: <Triangle className="h-8 w-8" /> },
      ],
    },
    {
      title: "Polygons",
      items: [
        { type: "pentagon" as const, label: "Pentagon", icon: <Pentagon className="h-8 w-8" /> },
        { type: "hexagon" as const, label: "Hexagon", icon: <Hexagon className="h-8 w-8" /> },
        { type: "diamond" as const, label: "Diamond", icon: <Diamond className="h-8 w-8" /> },
      ],
    },
    {
      title: "Stars & More",
      items: [
        { type: "star" as const, label: "Star", icon: <Star className="h-8 w-8" /> },
        { type: "heart" as const, label: "Heart", icon: <Heart className="h-8 w-8" /> },
        { type: "arrow" as const, label: "Arrow", icon: <ArrowRight className="h-8 w-8" /> },
      ],
    },
  ];

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">
      <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-3 space-y-3">
            <div className="flex gap-1">
              <Button size="sm" variant={sidePanel === "shapes" ? "default" : "outline"} onClick={() => setSidePanel("shapes")} className={sidePanel === "shapes" ? "bg-violet-600 flex-1" : "border-slate-600 text-gray-400 flex-1"} data-testid="button-panel-shapes">
                Shapes
              </Button>
              <Button size="sm" variant={sidePanel === "position" ? "default" : "outline"} onClick={() => setSidePanel("position")} className={sidePanel === "position" ? "bg-violet-600 flex-1" : "border-slate-600 text-gray-400 flex-1"} data-testid="button-panel-position">
                Position
              </Button>
              <Button size="sm" variant={sidePanel === "layers" ? "default" : "outline"} onClick={() => setSidePanel("layers")} className={sidePanel === "layers" ? "bg-violet-600 flex-1" : "border-slate-600 text-gray-400 flex-1"} data-testid="button-panel-layers">
                Layers
              </Button>
            </div>

            {sidePanel === "shapes" && (
              <div className="space-y-4">
                <div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={addImage} className="hidden" data-testid="input-canvas-image" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full border-slate-600 text-gray-300 hover:text-white" data-testid="button-add-image">
                    <ImageIcon className="h-4 w-4 mr-2" /> Add Image
                  </Button>
                </div>
                {shapeCategories.map((cat) => (
                  <div key={cat.title}>
                    <Label className="text-gray-400 text-xs uppercase tracking-wider">{cat.title}</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {cat.items.map((shape) => (
                        <button
                          key={shape.type}
                          onClick={() => addShape(shape.type, shape.label)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-700 hover:border-violet-500 hover:bg-slate-800 transition-colors text-gray-400 hover:text-white"
                          data-testid={`button-shape-${shape.type}`}
                        >
                          {shape.icon}
                          <span className="text-[9px]">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sidePanel === "position" && selected && (
              <div className="space-y-4">
                <Tabs value={positionTab} onValueChange={(v) => setPositionTab(v as any)}>
                  <TabsList className="w-full bg-slate-800 border border-slate-700">
                    <TabsTrigger value="arrange" className="flex-1 data-[state=active]:bg-violet-600 text-xs" data-testid="tab-arrange">Arrange</TabsTrigger>
                    <TabsTrigger value="layers" className="flex-1 data-[state=active]:bg-violet-600 text-xs" data-testid="tab-layers">Layers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="arrange" className="space-y-4 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => moveLayer(selected.id, "up")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-forward">
                        <ChevronUp className="h-3 w-3 mr-1" /> Forward
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveLayer(selected.id, "down")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-backward">
                        <ChevronDown className="h-3 w-3 mr-1" /> Backward
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveLayer(selected.id, "top")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-to-front">
                        <ChevronsUp className="h-3 w-3 mr-1" /> To front
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveLayer(selected.id, "bottom")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-to-back">
                        <ChevronsDown className="h-3 w-3 mr-1" /> To back
                      </Button>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs">Align to page</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button size="sm" variant="outline" onClick={() => alignElement("top")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-top">
                          <AlignStartHorizontal className="h-3 w-3 mr-1" /> Top
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => alignElement("left")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-left">
                          <AlignStartVertical className="h-3 w-3 mr-1" /> Left
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => alignElement("middle")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-middle">
                          <AlignCenterHorizontal className="h-3 w-3 mr-1" /> Middle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => alignElement("centre")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-centre">
                          <AlignCenterVertical className="h-3 w-3 mr-1" /> Centre
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => alignElement("bottom")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-bottom">
                          <AlignEndHorizontal className="h-3 w-3 mr-1" /> Bottom
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => alignElement("right")} className="border-slate-600 text-gray-300 text-xs" data-testid="button-align-right">
                          <AlignEndVertical className="h-3 w-3 mr-1" /> Right
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs">Advanced</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Label className="text-gray-500 text-[10px]">Width</Label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={Math.round(selected.width)} onChange={(e) => updateEl(selected.id, { width: Math.max(20, Number(e.target.value)) })} className="bg-slate-800 border-slate-600 text-white h-8 text-xs" data-testid="input-width" />
                            <span className="text-[10px] text-gray-500">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">Height</Label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={Math.round(selected.height)} onChange={(e) => updateEl(selected.id, { height: Math.max(20, Number(e.target.value)) })} className="bg-slate-800 border-slate-600 text-white h-8 text-xs" data-testid="input-height" />
                            <span className="text-[10px] text-gray-500">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">X</Label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={Math.round(selected.x)} onChange={(e) => updateEl(selected.id, { x: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white h-8 text-xs" data-testid="input-x" />
                            <span className="text-[10px] text-gray-500">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">Y</Label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={Math.round(selected.y)} onChange={(e) => updateEl(selected.id, { y: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white h-8 text-xs" data-testid="input-y" />
                            <span className="text-[10px] text-gray-500">px</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">Rotate</Label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={Math.round(selected.rotation)} onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white h-8 text-xs" data-testid="input-rotate" />
                            <span className="text-[10px] text-gray-500">°</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">Opacity</Label>
                          <Slider value={[selected.opacity * 100]} onValueChange={([v]) => updateEl(selected.id, { opacity: v / 100 })} min={0} max={100} step={5} className="mt-2" data-testid="slider-opacity" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs">Colors</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Label className="text-gray-500 text-[10px]">Fill</Label>
                          <input type="color" value={selected.color === "transparent" ? "#000000" : selected.color} onChange={(e) => updateEl(selected.id, { color: e.target.value })} className="w-full h-8 rounded cursor-pointer border border-slate-600" data-testid="input-fill-color" />
                        </div>
                        <div>
                          <Label className="text-gray-500 text-[10px]">Stroke</Label>
                          <input type="color" value={selected.strokeColor} onChange={(e) => updateEl(selected.id, { strokeColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border border-slate-600" data-testid="input-stroke-color" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-gray-500 text-[10px]">Stroke Width: {selected.strokeWidth}px</Label>
                        <Slider value={[selected.strokeWidth]} onValueChange={([v]) => updateEl(selected.id, { strokeWidth: v })} min={0} max={20} step={1} className="mt-1" data-testid="slider-stroke" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => duplicateEl(selected.id)} className="flex-1 border-slate-600 text-gray-300 text-xs" data-testid="button-duplicate">
                        <Copy className="h-3 w-3 mr-1" /> Duplicate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteEl(selected.id)} className="flex-1 border-red-800 text-red-400 hover:bg-red-900/30 text-xs" data-testid="button-delete-element">
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="layers" className="mt-3">
                    <LayersList elements={elements} selectedId={selectedId} setSelectedId={setSelectedId} updateEl={updateEl} deleteEl={deleteEl} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {sidePanel === "position" && !selected && (
              <div className="text-center text-gray-500 py-8">
                <MousePointer className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click an element to edit</p>
              </div>
            )}

            {sidePanel === "layers" && (
              <LayersList elements={elements} selectedId={selectedId} setSelectedId={setSelectedId} updateEl={updateEl} deleteEl={deleteEl} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Label className="text-gray-400 text-xs">Background</Label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-7 rounded cursor-pointer border border-slate-600" data-testid="input-canvas-bg" />
          </div>
          <div className="text-xs text-gray-500">{CANVAS_W} × {CANVAS_H}px</div>
          <div className="text-xs text-gray-500">{elements.length} elements</div>
          <div className="ml-auto">
            <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-canvas">
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden p-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="max-w-full max-h-full border border-slate-600 rounded shadow-2xl cursor-crosshair"
            style={{ imageRendering: "auto" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            data-testid="canvas-workspace"
          />
        </div>
        <canvas ref={renderCanvasRef} className="hidden" />
      </div>
    </div>
  );
}

function LayersList({ elements, selectedId, setSelectedId, updateEl, deleteEl }: {
  elements: CanvasElement[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateEl: (id: string, updates: Partial<CanvasElement>) => void;
  deleteEl: (id: string) => void;
}) {
  const reversed = [...elements].reverse();

  return (
    <div className="space-y-1">
      <Label className="text-gray-400 text-xs uppercase tracking-wider">All Layers</Label>
      {reversed.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">No elements yet</p>
      )}
      {reversed.map((el) => (
        <div
          key={el.id}
          onClick={() => setSelectedId(el.id)}
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
            selectedId === el.id ? "bg-violet-600/30 border border-violet-500" : "hover:bg-slate-800 border border-transparent"
          }`}
          data-testid={`layer-item-${el.id}`}
        >
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
            {el.type === "image" ? (
              <ImageIcon className="h-4 w-4 text-gray-400" />
            ) : el.type === "rect" ? (
              <Square className="h-4 w-4" style={{ color: el.color }} />
            ) : el.type === "circle" ? (
              <Circle className="h-4 w-4" style={{ color: el.color }} />
            ) : el.type === "triangle" ? (
              <Triangle className="h-4 w-4" style={{ color: el.color }} />
            ) : el.type === "star" ? (
              <Star className="h-4 w-4" style={{ color: el.color }} />
            ) : el.type === "heart" ? (
              <Heart className="h-4 w-4" style={{ color: el.color }} />
            ) : (
              <div className="w-4 h-4 rounded" style={{ backgroundColor: el.color }} />
            )}
          </div>
          <span className="text-xs text-gray-300 flex-1 truncate">{el.label}</span>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { visible: !el.visible }); }} className="text-gray-500 hover:text-white" data-testid={`button-toggle-visibility-${el.id}`}>
              {el.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { locked: !el.locked }); }} className="text-gray-500 hover:text-white" data-testid={`button-toggle-lock-${el.id}`}>
              {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteEl(el.id); }} className="text-gray-500 hover:text-red-400" data-testid={`button-delete-layer-${el.id}`}>
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
