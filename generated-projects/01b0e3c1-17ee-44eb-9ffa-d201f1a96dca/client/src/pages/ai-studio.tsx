import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Layers,
  Film,
  Video,
  Loader2,
  Sparkles,
  Plus,
  X,
  RotateCcw,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  MoveUp,
  MoveDown,
  Upload,
  PenTool,
  UserCheck,
  Trash2,
  Link,
  Globe,
} from "lucide-react";
import CanvasEditor from "./canvas-editor";

export default function AIStudio() {
  const [, setLocation] = useLocation();
  const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/admin");
    }
  }, [isLoggedIn, setLocation]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/super-admin")}
            className="text-gray-400 hover:text-white"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AI Creative Studio
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="image-creator" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 w-full flex md:grid md:grid-cols-8 gap-1 overflow-x-auto no-scrollbar">
            <TabsTrigger value="image-creator" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0">
              <ImageIcon className="h-4 w-4" /> <span className="truncate">AI Image</span>
            </TabsTrigger>
            <TabsTrigger value="image-upload" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0" data-testid="tab-image-upload">
              <Upload className="h-4 w-4" /> <span className="truncate">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="image-merger" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0">
              <Layers className="h-4 w-4" /> <span className="truncate">Merger</span>
            </TabsTrigger>
            <TabsTrigger value="gif-creator" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0">
              <Film className="h-4 w-4" /> <span className="truncate">GIF</span>
            </TabsTrigger>
            <TabsTrigger value="video-creator" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0">
              <Video className="h-4 w-4" /> <span className="truncate">Video</span>
            </TabsTrigger>
            <TabsTrigger value="text-format" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0">
              <Type className="h-4 w-4" /> <span className="truncate">Text</span>
            </TabsTrigger>
            <TabsTrigger value="canvas-editor" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0" data-testid="tab-canvas-editor">
              <PenTool className="h-4 w-4" /> <span className="truncate">Canvas</span>
            </TabsTrigger>
            <TabsTrigger value="face-swap" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-[10px] md:text-sm flex-shrink-0 flex flex-col md:flex-row items-center gap-0.5 md:gap-1 px-2 py-1.5 min-w-[3.5rem] md:min-w-0" data-testid="tab-face-swap">
              <UserCheck className="h-4 w-4" /> <span className="truncate">Face Swap</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image-creator">
            <AIImageCreator />
          </TabsContent>
          <TabsContent value="image-upload">
            <ImageUploadEnhancer />
          </TabsContent>
          <TabsContent value="image-merger">
            <ImageMerger />
          </TabsContent>
          <TabsContent value="gif-creator">
            <GifCreator />
          </TabsContent>
          <TabsContent value="video-creator">
            <VideoCreator />
          </TabsContent>
          <TabsContent value="text-format">
            <TextFormatter />
          </TabsContent>
          <TabsContent value="canvas-editor">
            <CanvasEditor />
          </TabsContent>
          <TabsContent value="face-swap">
            <FaceSwap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function drawLogoOverlay(ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement, W: number, H: number, position: string, size: number) {
  const logoW = size;
  const logoH = (logoImg.height / logoImg.width) * logoW;
  const pad = 15;
  let lx = pad, ly = pad;
  if (position === "top-right") { lx = W - logoW - pad; ly = pad; }
  else if (position === "bottom-left") { lx = pad; ly = H - logoH - pad; }
  else if (position === "bottom-right") { lx = W - logoW - pad; ly = H - logoH - pad; }
  else if (position === "center") { lx = (W - logoW) / 2; ly = (H - logoH) / 2; }

  ctx.save();
  ctx.beginPath();
  const cx = lx + logoW / 2, cy = ly + logoH / 2, r = Math.max(logoW, logoH) / 2 + 4;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.restore();
  ctx.drawImage(logoImg, lx, ly, logoW, logoH);
}

function LogoUploader({ logo, setLogo, logoPosition, setLogoPosition, logoSize, setLogoSize, accentColor = "purple" }: {
  logo: string | null;
  setLogo: (v: string | null) => void;
  logoPosition: string;
  setLogoPosition: (v: string) => void;
  logoSize: number;
  setLogoSize: (v: number) => void;
  accentColor?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setLogo(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
      <Label className="text-gray-300 flex items-center gap-2">
        <Upload className="h-4 w-4" /> Upload Branch Logo (optional)
      </Label>
      <input type="file" accept="image/png,image/jpeg,image/gif" ref={inputRef} onChange={handleUpload} className="hidden" data-testid="input-logo-file" />
      <div className="flex items-center gap-3">
        {logo ? (
          <div className="relative group">
            <img src={logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-600 bg-white p-1" />
            <button onClick={() => setLogo(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" data-testid="button-remove-logo">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="border-slate-600 text-gray-400 hover:text-white" data-testid="button-upload-logo">
          <Upload className="h-3 w-3 mr-1" /> {logo ? "Change" : "Upload"} Logo
        </Button>
        <span className="text-xs text-gray-500">PNG, JPG, GIF</span>
      </div>
      {logo && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-400 text-xs">Position</Label>
            <Select value={logoPosition} onValueChange={setLogoPosition}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1 h-8 text-xs" data-testid="select-logo-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Size: {logoSize}px</Label>
            <Slider value={[logoSize]} onValueChange={([v]) => setLogoSize(v)} min={30} max={200} step={5} className="mt-2" data-testid="slider-logo-size" />
          </div>
        </div>
      )}
    </div>
  );
}

function AIImageCreator() {
  const [prompt, setPrompt] = useState("");
  const [shopName, setShopName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("top-right");
  const [logoSize, setLogoSize] = useState(80);
  const [size, setSize] = useState("1024x1024");
  const [background, setBackground] = useState("white");
  const [customBg, setCustomBg] = useState("#ffffff");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyLogoOverlay = useCallback(async (baseImage: string) => {
    if (!logo) {
      setFinalImage(baseImage);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) { setFinalImage(baseImage); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { setFinalImage(baseImage); return; }

    const bgImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = baseImage;
    });

    const logoImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = logo;
    });

    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    ctx.drawImage(bgImg, 0, 0);
    drawLogoOverlay(ctx, logoImg, bgImg.width, bgImg.height, logoPosition, logoSize);
    setFinalImage(canvas.toDataURL("image/png"));
  }, [logo, logoPosition, logoSize]);

  useEffect(() => {
    if (generatedImage) applyLogoOverlay(generatedImage);
  }, [generatedImage, logo, logoPosition, logoSize, applyLogoOverlay]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe what you want to create", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const bgValue = background === "custom" ? customBg : background;
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), size, background: bgValue, shopName: shopName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setGeneratedImage(data.image);
      setRevisedPrompt(data.revised_prompt || "");
      toast({ title: "Image Generated!", description: "Your AI image is ready" });
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const img = finalImage || generatedImage;
    if (!img) return;
    const link = document.createElement("a");
    link.href = img;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Sparkles className="h-5 w-5" />
            AI Image Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">Describe your image</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. chicken burger with sesame bun, juicy patty, fresh lettuce and tomato"
              className="bg-slate-800 border-slate-600 text-white mt-1 min-h-[100px]"
              data-testid="input-ai-prompt"
            />
          </div>

          <LogoUploader logo={logo} setLogo={setLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} logoSize={logoSize} setLogoSize={setLogoSize} accentColor="purple" />

          <div>
            <Label className="text-gray-300">Shop Name on Wrapper (optional)</Label>
            <Input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Tawa Grill, Mujeeb Sweets"
              className="bg-slate-800 border-slate-600 text-white mt-1"
              data-testid="input-shop-name"
            />
            <p className="text-xs text-gray-500 mt-1">The shop name will appear on the food wrapper/packaging paper</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Image Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1" data-testid="select-ai-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024 x 1024 (Large)</SelectItem>
                  <SelectItem value="600x450">600 x 450 (Product)</SelectItem>
                  <SelectItem value="512x512">512 x 512 (Medium)</SelectItem>
                  <SelectItem value="256x256">256 x 256 (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Background</Label>
              <Select value={background} onValueChange={setBackground}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1" data-testid="select-ai-bg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="transparent">Transparent</SelectItem>
                  <SelectItem value="custom">Custom Color</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {background === "custom" && (
            <div>
              <Label className="text-gray-300">Custom Color</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                <Input value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
            data-testid="button-generate-image"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating... (may take 15-30s)
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={canvasRef} className="hidden" />
          {(finalImage || generatedImage) ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                <img src={finalImage || generatedImage!} alt="AI Generated" className="w-full h-auto" data-testid="img-generated" />
              </div>
              {revisedPrompt && (
                <p className="text-xs text-gray-500 italic">AI interpretation: {revisedPrompt}</p>
              )}
              <Button onClick={handleDownload} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-image">
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
              <div className="text-center text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Your generated image will appear here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ImageMerger() {
  const [images, setImages] = useState<string[]>([]);
  const [layout, setLayout] = useState("grid");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [padding, setPadding] = useState(0);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("top-right");
  const [logoSize, setLogoSize] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const mergeImages = useCallback(async () => {
    if (images.length < 2) {
      toast({ title: "Need at least 2 images", variant: "destructive" });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadedImages = await Promise.all(
      images.map(src => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }))
    );

    const count = loadedImages.length;
    let cols: number, rows: number;

    if (layout === "horizontal") {
      cols = count; rows = 1;
    } else if (layout === "vertical") {
      cols = 1; rows = count;
    } else {
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
    }

    const cellW = 400;
    const cellH = 300;
    const totalW = cols * cellW + (cols + 1) * padding;
    const totalH = rows * cellH + (rows + 1) * padding;

    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalW, totalH);

    loadedImages.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellW + padding);
      const y = padding + row * (cellH + padding);

      const scale = Math.max(cellW / img.width, cellH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = x + (cellW - drawW) / 2;
      const offsetY = y + (cellH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellW, cellH);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    });

    if (logo) {
      const logoImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = logo;
      });
      drawLogoOverlay(ctx, logoImg, totalW, totalH, logoPosition, logoSize);
    }

    setMergedImage(canvas.toDataURL("image/png"));
    toast({ title: "Images Merged!", description: `${count} images combined` });
  }, [images, layout, bgColor, padding, logo, logoPosition, logoSize]);

  const handleDownload = () => {
    if (!mergedImage) return;
    const link = document.createElement("a");
    link.href = mergedImage;
    link.download = `merged-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Layers className="h-5 w-5" />
            Image Merger (Meal Composer)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-2 border-slate-600 hover:border-blue-500 h-20 text-gray-400 hover:text-blue-400"
            data-testid="button-upload-merger"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Images (burger, fries, drink, etc.)
          </Button>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Upload ${i + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-600" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Layout</Label>
              <Select value={layout} onValueChange={setLayout}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="horizontal">Side by Side</SelectItem>
                  <SelectItem value="vertical">Stacked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Background</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Padding: {padding}px</Label>
            <Slider value={[padding]} onValueChange={([v]) => setPadding(v)} min={0} max={40} step={2} className="mt-2" />
          </div>

          <LogoUploader logo={logo} setLogo={setLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} logoSize={logoSize} setLogoSize={setLogoSize} accentColor="blue" />

          <Button
            onClick={mergeImages}
            disabled={images.length < 2}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg py-6"
            data-testid="button-merge-images"
          >
            <Layers className="h-5 w-5 mr-2" />
            Merge {images.length} Images
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300">Merged Result</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={canvasRef} className="hidden" />
          {mergedImage ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <img src={mergedImage} alt="Merged" className="w-full h-auto" />
              </div>
              <Button onClick={handleDownload} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-merged">
                <Download className="h-4 w-4 mr-2" />
                Download Merged Image
              </Button>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
              <div className="text-center text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Upload 2+ images and click merge</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function drawEffect(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number, effect: string, progress: number, cornerRadius: number) {
  const scale = Math.min(W / img.width, H / img.height) * 0.85;
  const dw = img.width * scale;
  const dh = img.height * scale;

  const drawRounded = (x: number, y: number, w: number, h: number) => {
    if (cornerRadius > 0) {
      ctx.save();
      ctx.beginPath();
      const r = cornerRadius;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
  };

  if (effect === "slide") {
    const offsetX = (1 - progress) * W * 0.1 - W * 0.05;
    drawRounded((W - dw) / 2 + offsetX, (H - dh) / 2, dw, dh);
  } else if (effect === "zoom") {
    const zoomScale = 1 + progress * 0.15;
    const zw = dw * zoomScale, zh = dh * zoomScale;
    drawRounded((W - zw) / 2, (H - zh) / 2, zw, zh);
  } else if (effect === "rotate") {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.sin(progress * Math.PI * 2) * 0.08);
    const rScale = 1 + Math.sin(progress * Math.PI) * 0.05;
    drawRounded(-dw * rScale / 2, -dh * rScale / 2, dw * rScale, dh * rScale);
    ctx.restore();
  } else if (effect === "round") {
    const radius = 25;
    const cx = W / 2 + Math.cos(progress * Math.PI * 2) * radius;
    const cy = H / 2 + Math.sin(progress * Math.PI * 2) * radius;
    const rScale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
    drawRounded(cx - dw * rScale / 2, cy - dh * rScale / 2, dw * rScale, dh * rScale);
  } else if (effect === "static") {
    const gentleX = Math.sin(progress * Math.PI) * 8;
    const gentleScale = 1 + progress * 0.03;
    const sw = dw * gentleScale, sh = dh * gentleScale;
    drawRounded((W - sw) / 2 + gentleX, (H - sh) / 2, sw, sh);
  } else if (effect === "flip") {
    const flipCycle = (Math.sin(progress * Math.PI * 2) + 1) / 2;
    const scaleX = 0.3 + flipCycle * 0.7;
    const xShift = (1 - flipCycle) * W * 0.15;
    drawRounded((W - dw * scaleX) / 2 + xShift, (H - dh) / 2, dw * scaleX, dh);
  } else if (effect === "shake") {
    const shakeX = Math.sin(progress * Math.PI * 8) * 12;
    const shakeY = Math.cos(progress * Math.PI * 6) * 8;
    const zScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
    drawRounded((W - dw * zScale) / 2 + shakeX, (H - dh * zScale) / 2 + shakeY, dw * zScale, dh * zScale);
  } else if (effect === "whip") {
    const whipX = Math.pow(progress, 0.3) * W * 0.15 - W * 0.075;
    const blur = Math.abs(Math.sin(progress * Math.PI * 3)) * 0.02;
    const sX = 1 + blur;
    drawRounded((W - dw * sX) / 2 + whipX, (H - dh) / 2, dw * sX, dh);
  } else if (effect === "pop") {
    const popScale = progress < 0.15 ? 0.3 + progress / 0.15 * 0.9 : progress < 0.25 ? 1.2 - (progress - 0.15) / 0.1 * 0.2 : 1.0;
    const pw = dw * popScale, ph = dh * popScale;
    ctx.globalAlpha = Math.min(1, progress * 5);
    drawRounded((W - pw) / 2, (H - ph) / 2, pw, ph);
    ctx.globalAlpha = 1;
  } else if (effect === "wipe") {
    const wipeX = progress * (W + dw) - dw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wipeX + dw, H);
    ctx.clip();
    drawRounded((W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  } else if (effect === "breathe") {
    const breathScale = 1 + Math.sin(progress * Math.PI * 2) * 0.08;
    const bw = dw * breathScale, bh = dh * breathScale;
    ctx.globalAlpha = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
    drawRounded((W - bw) / 2, (H - bh) / 2, bw, bh);
    ctx.globalAlpha = 1;
  } else if (effect === "drift") {
    const dx = Math.sin(progress * Math.PI * 2) * 30;
    const dy = Math.cos(progress * Math.PI * 1.5) * 15;
    drawRounded((W - dw) / 2 + dx, (H - dh) / 2 + dy, dw, dh);
  } else if (effect === "tumble") {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(progress * Math.PI * 2);
    const tScale = 0.5 + Math.abs(Math.sin(progress * Math.PI)) * 0.5;
    drawRounded(-dw * tScale / 2, -dh * tScale / 2, dw * tScale, dh * tScale);
    ctx.restore();
  } else if (effect === "pulse") {
    const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.06;
    const pw2 = dw * pulseScale, ph2 = dh * pulseScale;
    drawRounded((W - pw2) / 2, (H - ph2) / 2, pw2, ph2);
  } else if (effect === "wiggle") {
    const wigAngle = Math.sin(progress * Math.PI * 6) * 0.06;
    const wigX = Math.sin(progress * Math.PI * 4) * 10;
    ctx.save();
    ctx.translate(W / 2 + wigX, H / 2);
    ctx.rotate(wigAngle);
    drawRounded(-dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  } else if (effect === "neon") {
    ctx.save();
    ctx.shadowColor = `hsl(${progress * 360}, 100%, 60%)`;
    ctx.shadowBlur = 20 + Math.sin(progress * Math.PI * 4) * 10;
    drawRounded((W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  } else if (effect === "rise") {
    const riseY = (1 - progress) * H * 0.3;
    ctx.globalAlpha = Math.min(1, progress * 3);
    const riseScale = 0.8 + progress * 0.2;
    const rw = dw * riseScale, rh = dh * riseScale;
    drawRounded((W - rw) / 2, (H - rh) / 2 + riseY, rw, rh);
    ctx.globalAlpha = 1;
  } else if (effect === "blur_in") {
    ctx.save();
    const blurAmount = Math.max(0, (1 - progress * 2)) * 8;
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.globalAlpha = Math.min(1, progress * 2);
    const bScale = 0.9 + progress * 0.1;
    drawRounded((W - dw * bScale) / 2, (H - dh * bScale) / 2, dw * bScale, dh * bScale);
    ctx.restore();
  } else if (effect === "flicker") {
    ctx.globalAlpha = 0.4 + Math.abs(Math.sin(progress * Math.PI * 8)) * 0.6;
    drawRounded((W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  } else if (effect === "stomp") {
    const stompP = progress < 0.2 ? progress / 0.2 : 1;
    const stompScale = progress < 0.2 ? 1.5 - stompP * 0.5 : 1.0;
    const sw2 = dw * stompScale, sh2 = dh * stompScale;
    ctx.globalAlpha = Math.min(1, progress * 4);
    drawRounded((W - sw2) / 2, (H - sh2) / 2, sw2, sh2);
    ctx.globalAlpha = 1;
  } else if (effect === "succession") {
    const copies = 3;
    for (let c = copies - 1; c >= 0; c--) {
      const delay = c * 0.15;
      const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
      ctx.globalAlpha = c === 0 ? 1 : 0.15;
      const sScale = 0.7 + p * 0.3;
      drawRounded((W - dw * sScale) / 2, (H - dh * sScale) / 2, dw * sScale, dh * sScale);
    }
    ctx.globalAlpha = 1;
  } else if (effect === "spin_ring") {
    drawRounded((W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    const ringRadius = Math.max(dw, dh) / 2 + 15;
    const ringWidth = 6;
    for (let r = 0; r < 3; r++) {
      const angle = progress * Math.PI * 2 * (r % 2 === 0 ? 1 : -1) + (r * Math.PI * 2 / 3);
      const arcLen = Math.PI * 0.6 + Math.sin(progress * Math.PI * 4) * 0.3;
      const rOff = r * 4;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + rOff, angle, angle + arcLen);
      ctx.strokeStyle = `hsl(${(progress * 360 + r * 120) % 360}, 80%, 60%)`;
      ctx.lineWidth = ringWidth - r;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    const dotCount = 6;
    for (let d = 0; d < dotCount; d++) {
      const dotAngle = progress * Math.PI * 2 + (d * Math.PI * 2 / dotCount);
      const dx = Math.cos(dotAngle) * (ringRadius + 10);
      const dy = Math.sin(dotAngle) * (ringRadius + 10);
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${(progress * 360 + d * 60) % 360}, 90%, 70%)`;
      ctx.fill();
    }
    ctx.restore();
  } else {
    drawRounded((W - dw) / 2, (H - dh) / 2, dw, dh);
  }
}

function removeBackground(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imageData.data;

      const corners = [
        [0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1],
        [Math.floor(c.width / 2), 0], [Math.floor(c.width / 2), c.height - 1],
        [0, Math.floor(c.height / 2)], [c.width - 1, Math.floor(c.height / 2)]
      ];
      let totalR = 0, totalG = 0, totalB = 0;
      corners.forEach(([x, y]) => {
        const idx = (y * c.width + x) * 4;
        totalR += data[idx]; totalG += data[idx + 1]; totalB += data[idx + 2];
      });
      const bgR = totalR / corners.length, bgG = totalG / corners.length, bgB = totalB / corners.length;

      const threshold = 55;
      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bgR, dg = data[i + 1] - bgG, db = data[i + 2] - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < threshold) {
          data[i + 3] = 0;
        } else if (dist < threshold + 30) {
          data[i + 3] = Math.round(((dist - threshold) / 30) * 255);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.src = imageSrc;
  });
}

function GifCreator() {
  const [images, setImages] = useState<string[]>([]);
  const [effect, setEffect] = useState("slide");
  const [speed, setSpeed] = useState(500);
  const [direction, setDirection] = useState("ltr");
  const [cornerRadius, setCornerRadius] = useState(0);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("top-right");
  const [logoSize, setLogoSize] = useState(60);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [removingBg, setRemovingBg] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveBg = async (index: number) => {
    setRemovingBg(index);
    try {
      const result = await removeBackground(images[index]);
      setImages(prev => prev.map((img, i) => i === index ? result : img));
      toast({ title: "Background removed!" });
    } catch {
      toast({ title: "Failed to remove background", variant: "destructive" });
    }
    setRemovingBg(null);
  };

  const drawBlurBg = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) => {
    const bgScale = Math.max(W / img.width, H / img.height) * 1.3;
    const bgW = img.width * bgScale, bgH = img.height * bgScale;
    ctx.filter = "blur(20px) brightness(0.5)";
    ctx.drawImage(img, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);
    ctx.filter = "none";
  };

  const createGif = async () => {
    if (images.length < 1) {
      toast({ title: "Need at least 1 image", variant: "destructive" });
      return;
    }
    setCreating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 500, H = 400;
      canvas.width = W;
      canvas.height = H;

      const loadedImages = await Promise.all(
        images.map(src => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        }))
      );

      let logoImg: HTMLImageElement | null = null;
      if (logo) {
        logoImg = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = logo!;
        });
      }

      const orderedImages = direction === "rtl" ? [...loadedImages].reverse() : loadedImages;
      const frames: string[] = [];
      const framesPerTransition = 8;

      if (orderedImages.length === 1) {
        // single image: skip pre-rendering, draw live in recorder
      } else {
        for (let i = 0; i < orderedImages.length; i++) {
          const img = orderedImages[i];
          drawBlurBg(ctx, img, W, H);
          drawEffect(ctx, img, W, H, effect, 0.5, cornerRadius);
          if (logoImg) drawLogoOverlay(ctx, logoImg, W, H, logoPosition, logoSize);
          for (let f = 0; f < 4; f++) frames.push(canvas.toDataURL("image/png"));

          if (i < orderedImages.length - 1) {
            const next = orderedImages[i + 1];
            for (let f = 0; f < framesPerTransition; f++) {
              const progress = f / framesPerTransition;
              drawBlurBg(ctx, img, W, H);
              ctx.globalAlpha = 1 - progress;
              drawEffect(ctx, img, W, H, effect, 0.5 + progress * 0.5, cornerRadius);
              ctx.globalAlpha = progress;
              drawBlurBg(ctx, next, W, H);
              drawEffect(ctx, next, W, H, effect, progress * 0.5, cornerRadius);
              ctx.globalAlpha = 1;
              if (logoImg) drawLogoOverlay(ctx, logoImg, W, H, logoPosition, logoSize);
              frames.push(canvas.toDataURL("image/png"));
            }
          }
        }
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      const frameDelay = speed === 300 ? 30 : speed === 800 ? 80 : 50;
      const totalAnimFrames = orderedImages.length === 1 ? 60 : frames.length;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.start();

        if (orderedImages.length === 1) {
          const img = orderedImages[0];
          let fIdx = 0;
          const drawSingle = () => {
            if (fIdx >= totalAnimFrames) {
              recorder.stop();
              return;
            }
            const progress = fIdx / totalAnimFrames;
            drawBlurBg(ctx, img, W, H);
            drawEffect(ctx, img, W, H, effect, progress, cornerRadius);
            if (logoImg) drawLogoOverlay(ctx, logoImg, W, H, logoPosition, logoSize);
            fIdx++;
            setTimeout(drawSingle, frameDelay);
          };
          drawSingle();
        } else {
          let frameIndex = 0;
          const drawFrame = () => {
            if (frameIndex >= frames.length) {
              recorder.stop();
              return;
            }
            const frameImg = new Image();
            frameImg.onload = () => {
              ctx.drawImage(frameImg, 0, 0);
              frameIndex++;
              setTimeout(drawFrame, frameDelay);
            };
            frameImg.src = frames[frameIndex];
          };
          drawFrame();
        }
      });

      const blob = new Blob(chunks, { type: "video/webm" });
      setGifUrl(URL.createObjectURL(blob));
      toast({ title: "Animation Created!", description: `${images.length} images animated` });
    } catch (err: any) {
      toast({ title: "Failed to create animation", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Film className="h-5 w-5" />
            GIF / Animation Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-2 border-slate-600 hover:border-green-500 h-20 text-gray-400 hover:text-green-400"
            data-testid="button-upload-gif"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Product Images
          </Button>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Frame ${i + 1}`} className="w-full h-16 object-contain rounded border border-slate-600 bg-slate-800" />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100" data-testid={`button-remove-gif-image-${i}`}>
                    <X className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveBg(i)}
                    disabled={removingBg === i}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-[9px] text-center py-1 text-green-300 hover:text-green-200 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                    data-testid={`button-remove-bg-${i}`}
                  >
                    {removingBg === i ? "Removing..." : "Remove BG"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300">Effect</Label>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="rotate">Subtle Rotate</SelectItem>
                  <SelectItem value="round">Round Motion</SelectItem>
                  <SelectItem value="static">Static Drift</SelectItem>
                  <SelectItem value="flip">3D Flip</SelectItem>
                  <SelectItem value="shake">Shake Zoom</SelectItem>
                  <SelectItem value="whip">Whip Slide</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="wipe">Wipe</SelectItem>
                  <SelectItem value="breathe">Breathe</SelectItem>
                  <SelectItem value="drift">Drift</SelectItem>
                  <SelectItem value="tumble">Tumble</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="wiggle">Wiggle</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                  <SelectItem value="rise">Rise</SelectItem>
                  <SelectItem value="blur_in">Blur In</SelectItem>
                  <SelectItem value="flicker">Flicker</SelectItem>
                  <SelectItem value="stomp">Stomp</SelectItem>
                  <SelectItem value="succession">Succession</SelectItem>
                  <SelectItem value="spin_ring">Spin Ring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">Left → Right</SelectItem>
                  <SelectItem value="rtl">Right → Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Speed</Label>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Fast</SelectItem>
                  <SelectItem value="500">Normal</SelectItem>
                  <SelectItem value="800">Slow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Corner Rounding: {cornerRadius}px</Label>
            <Slider value={[cornerRadius]} onValueChange={([v]) => setCornerRadius(v)} min={0} max={60} step={5} className="mt-2" />
          </div>

          <LogoUploader logo={logo} setLogo={setLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} logoSize={logoSize} setLogoSize={setLogoSize} accentColor="green" />

          <Button
            onClick={createGif}
            disabled={images.length < 1 || creating}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-6"
            data-testid="button-create-gif"
          >
            {creating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...</> : <><Film className="h-5 w-5 mr-2" /> Create Animation</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300">Animation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={canvasRef} style={{ position: "absolute", left: "-9999px", width: 0, height: 0 }} />
          {gifUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <video src={gifUrl} autoPlay loop muted className="w-full h-auto" />
              </div>
              <a href={gifUrl} download={`animation-${Date.now()}.webm`}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-gif">
                  <Download className="h-4 w-4 mr-2" /> Download Animation
                </Button>
              </a>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
              <div className="text-center text-gray-500">
                <Film className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Upload images to create animation</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VideoCreator() {
  const [images, setImages] = useState<string[]>([]);
  const [effect, setEffect] = useState("slide");
  const [duration, setDuration] = useState(3);
  const [videoSpeed, setVideoSpeed] = useState("normal");
  const [cornerRadius, setCornerRadius] = useState(0);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("top-right");
  const [logoSize, setLogoSize] = useState(60);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImages(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const createVideo = async () => {
    if (images.length < 1) {
      toast({ title: "Need at least 1 image", variant: "destructive" });
      return;
    }
    setCreating(true);

    try {
      const canvas = document.createElement("canvas");
      const W = 640, H = 480;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const loadedImages = await Promise.all(
        images.map(src => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        }))
      );

      let logoImg: HTMLImageElement | null = null;
      if (logo) {
        logoImg = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = logo!;
        });
      }

      const fps = videoSpeed === "fast" ? 30 : videoSpeed === "slow" ? 15 : 24;
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const totalDuration = 30;
      const totalFrames = totalDuration * fps;
      const framesPerImage = duration * fps;
      let frameCount = 0;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.start();

        const drawFrame = () => {
          if (frameCount >= totalFrames) {
            recorder.stop();
            return;
          }

          const imgIndex = Math.floor(frameCount / framesPerImage) % loadedImages.length;
          const progress = (frameCount % framesPerImage) / framesPerImage;
          const img = loadedImages[imgIndex];

          const bgScale = Math.max(W / img.width, H / img.height) * 1.3;
          const bgW = img.width * bgScale, bgH = img.height * bgScale;
          ctx.filter = "blur(20px) brightness(0.5)";
          ctx.drawImage(img, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);
          ctx.filter = "none";

          drawEffect(ctx, img, W, H, effect, progress, cornerRadius);
          if (logoImg) drawLogoOverlay(ctx, logoImg, W, H, logoPosition, logoSize);

          frameCount++;
          const frameDelay = videoSpeed === "fast" ? 16 : videoSpeed === "slow" ? 66 : 33;
          setTimeout(drawFrame, frameDelay);
        };
        drawFrame();
      });

      const blob = new Blob(chunks, { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      toast({ title: "Video Created!", description: `${images.length} images turned into video` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Video className="h-5 w-5" />
            Video Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-2 border-slate-600 hover:border-orange-500 h-20 text-gray-400 hover:text-orange-400"
            data-testid="button-upload-video"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Product Images
          </Button>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Image ${i + 1}`} className="w-full h-16 object-cover rounded border border-slate-600" />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300">Effect</Label>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Slide Pan</SelectItem>
                  <SelectItem value="zoom">Zoom In</SelectItem>
                  <SelectItem value="rotate">Subtle Rotate</SelectItem>
                  <SelectItem value="round">Round Motion</SelectItem>
                  <SelectItem value="static">Static Drift</SelectItem>
                  <SelectItem value="flip">3D Flip</SelectItem>
                  <SelectItem value="shake">Shake Zoom</SelectItem>
                  <SelectItem value="whip">Whip Slide</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="wipe">Wipe</SelectItem>
                  <SelectItem value="breathe">Breathe</SelectItem>
                  <SelectItem value="drift">Drift</SelectItem>
                  <SelectItem value="tumble">Tumble</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="wiggle">Wiggle</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                  <SelectItem value="rise">Rise</SelectItem>
                  <SelectItem value="blur_in">Blur In</SelectItem>
                  <SelectItem value="flicker">Flicker</SelectItem>
                  <SelectItem value="stomp">Stomp</SelectItem>
                  <SelectItem value="succession">Succession</SelectItem>
                  <SelectItem value="spin_ring">Spin Ring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Speed</Label>
              <Select value={videoSpeed} onValueChange={setVideoSpeed}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Per image</Label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 sec</SelectItem>
                  <SelectItem value="3">3 sec</SelectItem>
                  <SelectItem value="5">5 sec</SelectItem>
                  <SelectItem value="10">10 sec</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Corner Rounding: {cornerRadius}px</Label>
            <Slider value={[cornerRadius]} onValueChange={([v]) => setCornerRadius(v)} min={0} max={60} step={5} className="mt-2" />
          </div>

          <LogoUploader logo={logo} setLogo={setLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} logoSize={logoSize} setLogoSize={setLogoSize} accentColor="orange" />

          <p className="text-xs text-gray-500">Total video: 30 seconds (images loop to fill)</p>

          <Button
            onClick={createVideo}
            disabled={images.length < 1 || creating}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg py-6"
            data-testid="button-create-video"
          >
            {creating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating Video...</> : <><Video className="h-5 w-5 mr-2" /> Create Video</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300">Video Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {videoUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <video src={videoUrl} controls autoPlay loop className="w-full h-auto" />
              </div>
              <a href={videoUrl} download={`product-video-${Date.now()}.webm`}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-video">
                  <Download className="h-4 w-4 mr-2" /> Download Video
                </Button>
              </a>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
              <div className="text-center text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Upload images and create your video</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TextFormatter() {
  const [text, setText] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState("h2");
  const [alignment, setAlignment] = useState("center");
  const [textColor, setTextColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#1e293b");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [verticalPos, setVerticalPos] = useState("center");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState("top-right");
  const [logoSize, setLogoSize] = useState(60);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fontSizes: Record<string, { label: string; px: number }> = {
    h2: { label: "H2 - Large", px: 48 },
    h3: { label: "H3 - Medium Large", px: 36 },
    h4: { label: "H4 - Medium", px: 28 },
    h5: { label: "H5 - Small", px: 22 },
  };

  const getPreviewStyle = (): React.CSSProperties => ({
    fontSize: `${fontSizes[fontSize].px}px`,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
    color: textColor,
    backgroundColor: bgColor,
    textAlign: alignment as any,
    display: "flex",
    alignItems: verticalPos === "top" ? "flex-start" : verticalPos === "bottom" ? "flex-end" : "center",
    justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
    padding: "20px",
    minHeight: "300px",
    borderRadius: "12px",
    wordBreak: "break-word" as any,
  });

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800, H = 400;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const px = fontSizes[fontSize].px;
    const weight = isBold ? "bold" : "normal";
    const style = isItalic ? "italic" : "normal";
    ctx.font = `${style} ${weight} ${px}px Arial, sans-serif`;
    ctx.fillStyle = textColor;

    let x = alignment === "left" ? 40 : alignment === "right" ? W - 40 : W / 2;
    let y = verticalPos === "top" ? px + 20 : verticalPos === "bottom" ? H - 20 : H / 2 + px / 3;
    ctx.textAlign = alignment as CanvasTextAlign;

    const lines = text.split("\n");
    const lineHeight = px * 1.3;
    if (lines.length > 1 && verticalPos === "center") {
      y -= (lines.length - 1) * lineHeight / 2;
    }
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });

    if (logo) {
      const logoImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = logo;
      });
      drawLogoOverlay(ctx, logoImg, W, H, logoPosition, logoSize);
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `text-banner-${Date.now()}.png`;
    link.click();
  };

  const copyCSS = () => {
    const css = `font-size: ${fontSizes[fontSize].px}px;\nfont-weight: ${isBold ? "bold" : "normal"};\nfont-style: ${isItalic ? "italic" : "normal"};\ncolor: ${textColor};\ntext-align: ${alignment};`;
    navigator.clipboard.writeText(css);
    toast({ title: "CSS Copied!", description: "Paste it into your styling" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-400">
            <Type className="h-5 w-5" />
            Text Formatting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">Your Text</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white mt-1 min-h-[80px]"
              placeholder="Enter your text..."
              data-testid="input-text-content"
            />
          </div>

          <div>
            <Label className="text-gray-300">Font Size</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {Object.entries(fontSizes).map(([key, val]) => (
                <Button
                  key={key}
                  variant={fontSize === key ? "default" : "outline"}
                  onClick={() => setFontSize(key)}
                  className={fontSize === key ? "bg-pink-600" : "border-slate-600 text-gray-400"}
                  size="sm"
                >
                  {key.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Text Alignment</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Button variant={alignment === "left" ? "default" : "outline"} onClick={() => setAlignment("left")} className={alignment === "left" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                <AlignLeft className="h-4 w-4 mr-1" /> Left
              </Button>
              <Button variant={alignment === "center" ? "default" : "outline"} onClick={() => setAlignment("center")} className={alignment === "center" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                <AlignCenter className="h-4 w-4 mr-1" /> Center
              </Button>
              <Button variant={alignment === "right" ? "default" : "outline"} onClick={() => setAlignment("right")} className={alignment === "right" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                <AlignRight className="h-4 w-4 mr-1" /> Right
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Vertical Position</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Button variant={verticalPos === "top" ? "default" : "outline"} onClick={() => setVerticalPos("top")} className={verticalPos === "top" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                <MoveUp className="h-4 w-4 mr-1" /> Top
              </Button>
              <Button variant={verticalPos === "center" ? "default" : "outline"} onClick={() => setVerticalPos("center")} className={verticalPos === "center" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                Center
              </Button>
              <Button variant={verticalPos === "bottom" ? "default" : "outline"} onClick={() => setVerticalPos("bottom")} className={verticalPos === "bottom" ? "bg-pink-600" : "border-slate-600 text-gray-400"} size="sm">
                <MoveDown className="h-4 w-4 mr-1" /> Bottom
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Style</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={isBold ? "default" : "outline"}
                  onClick={() => setIsBold(!isBold)}
                  className={isBold ? "bg-pink-600" : "border-slate-600 text-gray-400"}
                  size="sm"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={isItalic ? "default" : "outline"}
                  onClick={() => setIsItalic(!isItalic)}
                  className={isItalic ? "bg-pink-600" : "border-slate-600 text-gray-400"}
                  size="sm"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Colors</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex flex-col items-center gap-1">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <span className="text-[10px] text-gray-500">Text</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <span className="text-[10px] text-gray-500">BG</span>
                </div>
              </div>
            </div>
          </div>

          <LogoUploader logo={logo} setLogo={setLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} logoSize={logoSize} setLogoSize={setLogoSize} accentColor="pink" />

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-text">
              <Download className="h-4 w-4 mr-2" /> Download as Image
            </Button>
            <Button onClick={copyCSS} variant="outline" className="border-slate-600 text-gray-300" data-testid="button-copy-css">
              <Palette className="h-4 w-4 mr-2" /> Copy CSS
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={canvasRef} className="hidden" />
          <div style={getPreviewStyle()} data-testid="text-preview">
            <span>{text || "Preview"}</span>
          </div>
          <div className="mt-4 p-3 bg-slate-800 rounded-lg">
            <p className="text-xs text-gray-500 font-mono">
              font-size: {fontSizes[fontSize].px}px; font-weight: {isBold ? "bold" : "normal"}; font-style: {isItalic ? "italic" : "normal"}; color: {textColor}; text-align: {alignment};
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImageUploadEnhancer() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [background, setBackground] = useState("white-studio");
  const [customBg, setCustomBg] = useState("");
  const [shopName, setShopName] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [textPosition, setTextPosition] = useState("bottom");
  const [imageSize, setImageSize] = useState("600x450");
  const [removeBg, setRemoveBg] = useState(false);
  const [textStyle, setTextStyle] = useState("3d-clean");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [shopNameColor, setShopNameColor] = useState("#FFD700");
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use an image under 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resizeImage = (dataUrl: string, targetW: number, targetH: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  };

  const backgrounds: Record<string, string> = {
    "white-studio": "Clean white studio background with soft professional lighting",
    "gradient-modern": "Modern gradient background transitioning from light blue to soft purple",
    "kitchen": "Professional restaurant kitchen background, slightly blurred",
    "wooden-table": "Rustic wooden table surface with warm ambient lighting",
    "marble": "Elegant white marble surface with subtle veining",
    "outdoor-cafe": "Outdoor cafe setting with bokeh lights in background",
    "dark-elegant": "Dark elegant background with dramatic spotlight lighting",
    "fresh-greenery": "Fresh green leaves and plants background, natural feel",
    "custom": customBg || "plain colored background",
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast({ title: "Upload an image", description: "Please upload an image first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultImage(null);

    const bgDesc = backgrounds[background] || backgrounds["white-studio"];
    const [w, h] = imageSize === "600x450" ? [600, 450] : [0, 0];
    const sizeInstr = w > 0 ? `Output the image at exactly ${w}x${h} pixels.` : "Keep the original image dimensions.";

    const textStyleDesc: Record<string, string> = {
      "3d-clean": "bold 3D extruded text with clean edges, depth, shadows, and a glossy/metallic finish - like professional 3D rendered typography",
      "3d-gold": "luxurious 3D gold embossed text with metallic gold sheen, depth, and elegant shadows",
      "neon-glow": "bright pink/magenta neon glowing text with a soft luminous glow halo around each letter, like a neon sign at night",
      "neon-blue": "electric blue neon glowing text with bright cyan-blue glow radiating outward, like a bar neon sign",
      "fire": "fiery burning text with realistic orange and red flames coming off each letter, dramatic fire typography",
      "ice-frozen": "frozen icy text with frost crystals, ice blue color, icicles hanging from letters, cold winter style",
      "retro-vintage": "retro vintage typography with worn texture, faded colors, classic serif font with decorative swirls and old-school charm",
      "graffiti-street": "bold graffiti street art style text with spray paint texture, drips, urban feel, vibrant colors",
      "comic-pop": "comic book pop art style text with bold outlines, halftone dots pattern, action comic feel like POW or BOOM style",
      "elegant-script": "elegant flowing cursive script calligraphy, thin graceful strokes, luxury wedding invitation style",
      "rock-bold": "heavy rock band logo style text, bold blocky distressed letters with cracks and rough edges, concert poster feel",
      "pixel-retro": "pixel art retro 8-bit video game style text, blocky pixelated letters like classic arcade games",
      "rainbow-gradient": "colorful rainbow gradient flowing across the text, smooth color transitions from red through violet",
      "chrome-metallic": "shiny chrome metallic text with mirror reflections, polished silver metal finish, futuristic look",
      "wooden-rustic": "rustic wooden carved text looking like it's carved from natural wood, warm brown tones with grain texture",
      "sparkle-glitter": "sparkly glittery text covered in tiny glitter particles that catch the light, glamorous and shimmery",
      "shadow-long": "clean modern text with a dramatic long shadow extending diagonally, flat design style",
      "bubble-fun": "fun bubbly rounded balloon-style text, puffy inflated letters, playful and cheerful like party balloons",
      "sticker-outline": "bold outlined sticker style text with thick colored outline and white fill, like a vinyl sticker or badge",
      "watercolor": "soft watercolor painted text with gentle color bleeds, artistic brush stroke texture, dreamy feel",
      "flat-modern": "clean flat modern sans-serif text with solid color, minimal and professional",
      "embossed": "embossed/debossed text pressed into the surface with subtle depth and shadow",
    };

    let textInstr = "";
    if (overlayText || shopName) {
      const styleDesc = textStyleDesc[textStyle] || textStyleDesc["3d-clean"];
      const parts = [];
      if (overlayText) parts.push(`Add the text "${overlayText}" in ${textColor} color, rendered as ${styleDesc}. The text MUST be placed WELL INSIDE the image with generous padding from all edges - at least 10% margin from every border. Auto-scale font size so ALL characters fit fully visible, never cut off or cropped or bleeding outside`);
      if (shopName) parts.push(`Add the shop/brand name "${shopName}" in ${shopNameColor} color prominently on the product wrapper, packaging, or label if visible. If no wrapper exists, place it as a stylish branded banner/ribbon. Render it as ${styleDesc}. Keep the shop name text compact enough to fit fully inside the image`);
      const posDesc = textPosition === "top" ? "near the top area, about 10-15% from top edge" : textPosition === "center" ? "centered vertically in the middle" : "near the bottom area, about 10-15% from bottom edge";
      textInstr = parts.join(". ") + `. Position ALL text ${posDesc} of the image, keeping it FULLY INSIDE the image with comfortable margins. Auto-size fonts to fit within image boundaries - absolutely NO text should be outside, cut off, or extending beyond the image edges.`;
    }

    const bgRemovalInstr = removeBg
      ? `FIRST: Completely remove the original background from the uploaded image, isolating ONLY the main product/subject with clean precise edges. Then place the isolated product onto the new background.`
      : `Keep the product as-is from the uploaded image.`;

    const prompt = `PROFESSIONAL PRODUCT IMAGE ENHANCEMENT TASK

Look at the uploaded image carefully. You must recreate this EXACT same product/item/subject but enhanced for professional marketing:

1. BACKGROUND REMOVAL: ${bgRemovalInstr}
2. NEW BACKGROUND: The background MUST fill the ENTIRE image edge-to-edge with NO white borders, NO white margins, NO empty white space at top/bottom/sides. Background: ${bgDesc}
3. SUBJECT: The product must look IDENTICAL to the original - same shape, color, texture, details, proportions. Recreate it faithfully with high detail.
4. LIGHTING: Professional product photography lighting with soft shadows, highlights, and depth
5. QUALITY: High-end product photo look
${textInstr ? `6. TEXT & BRANDING: ${textInstr}` : ""}
${sizeInstr ? `7. SIZE: ${sizeInstr}` : ""}

CRITICAL RULES:
- ZERO white borders or margins - the background must cover every pixel of the image from edge to edge
- The product must look identical to the original
- ${removeBg ? "Remove ALL original background completely before placing on new background" : "Only change the background"}
- ${(overlayText || shopName) ? "ALL text must FIT COMPLETELY inside the image - auto-scale font size down if needed so no text is cut off or extends beyond image edges. Use the specified colors." : "No text needed"}
- Make the final image look like a premium product advertisement

Generate the enhanced image now.`;

    try {
      const base64 = uploadedImage.replace(/^data:image\/\w+;base64,/, "");
      const mime = uploadedImage.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";

      const res = await fetch("/api/generate-image-with-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageData: base64, imageMime: mime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhancement failed");
      let finalImage = `data:${data.mimeType};base64,${data.b64_json}`;
      if (imageSize === "600x450") {
        finalImage = await resizeImage(finalImage, 600, 450);
      }
      setResultImage(finalImage);
      toast({ title: "Image enhanced!", description: "Your product image has been recreated" });
    } catch (err: any) {
      toast({ title: "Enhancement failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.download = `enhanced-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-teal-400 flex items-center gap-2">
            <Upload className="h-5 w-5" /> Image Upload & Enhance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-800/50 border border-teal-900/30 rounded-lg p-3">
            <p className="text-xs text-teal-300/80">Upload any product image. AI will recreate it with a new background, add your text and shop name for professional marketing photos.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm font-medium">Upload Image</Label>
            <input type="file" accept="image/*" ref={uploadRef} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="hidden" data-testid="input-upload-enhance" />
            <div
              onClick={() => uploadRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-teal-500 transition-colors min-h-[140px] flex flex-col items-center justify-center"
              data-testid="dropzone-upload-enhance"
            >
              {uploadedImage ? (
                <div className="relative w-full">
                  <img src={uploadedImage} alt="Uploaded" className="max-h-40 mx-auto rounded-lg object-contain" />
                  <Button size="sm" variant="destructive" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }} data-testid="button-remove-upload-enhance">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">Click to upload any image</p>
                  <p className="text-xs text-slate-500 mt-1">Product, food, item - any image works</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Background Style</Label>
            <Select value={background} onValueChange={setBackground}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-bg-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white-studio">White Studio</SelectItem>
                <SelectItem value="gradient-modern">Modern Gradient</SelectItem>
                <SelectItem value="kitchen">Restaurant Kitchen</SelectItem>
                <SelectItem value="wooden-table">Wooden Table</SelectItem>
                <SelectItem value="marble">Marble Surface</SelectItem>
                <SelectItem value="outdoor-cafe">Outdoor Cafe</SelectItem>
                <SelectItem value="dark-elegant">Dark Elegant</SelectItem>
                <SelectItem value="fresh-greenery">Fresh Greenery</SelectItem>
                <SelectItem value="custom">Custom (describe below)</SelectItem>
              </SelectContent>
            </Select>
            {background === "custom" && (
              <Input
                placeholder="Describe your background (e.g., red brick wall, beach sunset)"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                data-testid="input-custom-bg"
              />
            )}
          </div>

          <div
            onClick={() => setRemoveBg(!removeBg)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${removeBg ? "bg-teal-900/40 border-teal-500" : "bg-slate-800/30 border-slate-700 hover:border-slate-500"}`}
            data-testid="toggle-remove-bg"
          >
            <div className={`w-10 h-5 rounded-full relative transition-colors ${removeBg ? "bg-teal-500" : "bg-slate-600"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${removeBg ? "left-5.5" : "left-0.5"}`} style={{ left: removeBg ? "22px" : "2px" }} />
            </div>
            <div>
              <p className="text-sm text-gray-200 font-medium">Remove Background First</p>
              <p className="text-xs text-gray-500">Isolate the product before placing on new background</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Add Text / Caption (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder='e.g., "Special Offer 20% OFF"'
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white flex-1"
                data-testid="input-overlay-text"
              />
              <div className="relative">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-600 bg-transparent"
                  title="Text Color"
                  data-testid="input-text-color"
                />
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {["#FFFFFF", "#FFD700", "#FF4444", "#00FF88", "#00BFFF", "#FF69B4", "#FFA500", "#000000"].map((c) => (
                <div
                  key={c}
                  onClick={() => setTextColor(c)}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${textColor === c ? "border-white scale-110" : "border-slate-600"}`}
                  style={{ backgroundColor: c }}
                  data-testid={`color-text-${c.replace("#", "")}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Shop Name on Wrapper (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Fresh Bites, The Food Corner"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white flex-1"
                data-testid="input-shop-name"
              />
              <div className="relative">
                <input
                  type="color"
                  value={shopNameColor}
                  onChange={(e) => setShopNameColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-600 bg-transparent"
                  title="Shop Name Color"
                  data-testid="input-shop-color"
                />
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {["#FFD700", "#FFFFFF", "#FF4444", "#00FF88", "#00BFFF", "#FF69B4", "#FFA500", "#000000"].map((c) => (
                <div
                  key={c}
                  onClick={() => setShopNameColor(c)}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${shopNameColor === c ? "border-white scale-110" : "border-slate-600"}`}
                  style={{ backgroundColor: c }}
                  data-testid={`color-shop-${c.replace("#", "")}`}
                />
              ))}
            </div>
          </div>

          {(overlayText || shopName) && (
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Text Style</Label>
              <Select value={textStyle} onValueChange={setTextStyle}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-text-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="3d-clean">3D Clean (Bold & Glossy)</SelectItem>
                  <SelectItem value="3d-gold">3D Gold (Luxury)</SelectItem>
                  <SelectItem value="neon-glow">Neon Glow (Pink)</SelectItem>
                  <SelectItem value="neon-blue">Neon Blue (Electric)</SelectItem>
                  <SelectItem value="fire">Fire / Flames</SelectItem>
                  <SelectItem value="ice-frozen">Ice / Frozen</SelectItem>
                  <SelectItem value="retro-vintage">Retro Vintage</SelectItem>
                  <SelectItem value="graffiti-street">Graffiti / Street Art</SelectItem>
                  <SelectItem value="comic-pop">Comic Pop Art</SelectItem>
                  <SelectItem value="elegant-script">Elegant Script / Cursive</SelectItem>
                  <SelectItem value="rock-bold">Rock / Bold Heavy</SelectItem>
                  <SelectItem value="pixel-retro">Pixel / 8-Bit Retro</SelectItem>
                  <SelectItem value="rainbow-gradient">Rainbow Gradient</SelectItem>
                  <SelectItem value="chrome-metallic">Chrome / Metallic</SelectItem>
                  <SelectItem value="wooden-rustic">Wooden / Rustic Carved</SelectItem>
                  <SelectItem value="sparkle-glitter">Sparkle / Glitter</SelectItem>
                  <SelectItem value="shadow-long">Long Shadow (Modern)</SelectItem>
                  <SelectItem value="bubble-fun">Bubble / Balloon Fun</SelectItem>
                  <SelectItem value="sticker-outline">Sticker / Outline Bold</SelectItem>
                  <SelectItem value="watercolor">Watercolor / Painted</SelectItem>
                  <SelectItem value="flat-modern">Flat Modern</SelectItem>
                  <SelectItem value="embossed">Embossed / Pressed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Text Position</Label>
              <Select value={textPosition} onValueChange={setTextPosition}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-text-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Image Size</Label>
              <Select value={imageSize} onValueChange={setImageSize}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-image-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="600x450">600 x 450 (Marketing)</SelectItem>
                  <SelectItem value="original">Original Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!uploadedImage || loading}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3"
            data-testid="button-enhance-image"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> AI is enhancing your image... (30-60s)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Enhance Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300 flex items-center justify-between">
            <span>Result</span>
            {resultImage && (
              <Button size="sm" onClick={downloadResult} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-enhanced">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-teal-500/30 border-t-teal-500 animate-spin" />
                <Sparkles className="h-6 w-6 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-teal-400 font-medium">AI is recreating your image...</p>
              <p className="text-xs text-gray-500">New background, text & enhancements</p>
            </div>
          ) : resultImage ? (
            <div className="space-y-4">
              <img src={resultImage} alt="Enhanced Result" className="w-full rounded-lg border border-slate-700" data-testid="img-enhanced-result" />
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Original</p>
                {uploadedImage && <img src={uploadedImage} alt="Original" className="h-24 mx-auto rounded object-contain opacity-60" />}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Upload className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">Upload an image and click enhance to see the result</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FaceSwap() {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("realistic");
  const [targetVideo, setTargetVideo] = useState<File | null>(null);
  const [targetVideoUrl, setTargetVideoUrl] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoTotalFrames, setVideoTotalFrames] = useState(0);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [swappedFrames, setSwappedFrames] = useState<string[]>([]);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("Mujeeb AI");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "center">("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [watermarkSize, setWatermarkSize] = useState(24);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const applyWatermark = (canvas: HTMLCanvasElement) => {
    if (!watermarkEnabled) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    const opacity = watermarkOpacity / 100;
    const padding = 15;

    if (watermarkType === "text" && watermarkText) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `bold ${watermarkSize}px Arial, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      const metrics = ctx.measureText(watermarkText);
      const tw = metrics.width;
      const th = watermarkSize;
      let x = 0, y = 0;
      if (watermarkPosition === "bottom-right") { x = w - tw - padding; y = h - padding; }
      else if (watermarkPosition === "bottom-left") { x = padding; y = h - padding; }
      else if (watermarkPosition === "top-right") { x = w - tw - padding; y = th + padding; }
      else if (watermarkPosition === "top-left") { x = padding; y = th + padding; }
      else { x = (w - tw) / 2; y = (h + th) / 2; }
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
      ctx.restore();
    }
  };

  const applyWatermarkToImage = (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!watermarkEnabled) { resolve(imgSrc); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        if (watermarkType === "image" && watermarkImage) {
          const wmImg = new Image();
          wmImg.onload = () => {
            const maxWmW = canvas.width * 0.25;
            const scale = Math.min(maxWmW / wmImg.width, 1);
            const wmW = wmImg.width * scale;
            const wmH = wmImg.height * scale;
            const padding = 15;
            let x = 0, y = 0;
            if (watermarkPosition === "bottom-right") { x = canvas.width - wmW - padding; y = canvas.height - wmH - padding; }
            else if (watermarkPosition === "bottom-left") { x = padding; y = canvas.height - wmH - padding; }
            else if (watermarkPosition === "top-right") { x = canvas.width - wmW - padding; y = padding; }
            else if (watermarkPosition === "top-left") { x = padding; y = padding; }
            else { x = (canvas.width - wmW) / 2; y = (canvas.height - wmH) / 2; }
            ctx.globalAlpha = watermarkOpacity / 100;
            ctx.drawImage(wmImg, x, y, wmW, wmH);
            ctx.globalAlpha = 1;
            resolve(canvas.toDataURL("image/png"));
          };
          wmImg.onerror = () => { applyWatermark(canvas); resolve(canvas.toDataURL("image/png")); };
          wmImg.src = watermarkImage;
        } else {
          applyWatermark(canvas);
          resolve(canvas.toDataURL("image/png"));
        }
      };
      img.src = imgSrc;
    });
  };

  const handleFileUpload = (file: File, setter: (v: string) => void) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const buildSmoothVideo = (frames: string[], applyWm: (c: HTMLCanvasElement) => void): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      const fps = 24;
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      recorder.start();

      const holdFrames = Math.round(fps * 1.0);
      const transitionFrames = Math.round(fps * 0.5);
      const totalSubFrames = frames.length * holdFrames + Math.max(0, frames.length - 1) * transitionFrames;
      let currentSub = 0;

      const loadedImages: HTMLImageElement[] = [];
      let loadedCount = 0;

      const drawFrame = (img: HTMLImageElement, alpha: number = 1) => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.globalAlpha = 1;
      };

      const renderLoop = () => {
        if (currentSub >= totalSubFrames) {
          setTimeout(() => recorder.stop(), 100);
          return;
        }

        let accum = 0;
        let segIdx = 0;
        let inTransition = false;
        let localPos = 0;

        for (let i = 0; i < frames.length; i++) {
          if (currentSub < accum + holdFrames) {
            segIdx = i;
            inTransition = false;
            localPos = currentSub - accum;
            break;
          }
          accum += holdFrames;
          if (i < frames.length - 1) {
            if (currentSub < accum + transitionFrames) {
              segIdx = i;
              inTransition = true;
              localPos = currentSub - accum;
              break;
            }
            accum += transitionFrames;
          }
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (inTransition && segIdx < loadedImages.length - 1) {
          const progress = localPos / transitionFrames;
          drawFrame(loadedImages[segIdx], 1 - progress);
          drawFrame(loadedImages[segIdx + 1], progress);
        } else if (segIdx < loadedImages.length) {
          drawFrame(loadedImages[segIdx]);
        }

        applyWm(canvas);
        currentSub++;
        setTimeout(renderLoop, 1000 / fps);
      };

      frames.forEach((src, i) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[i] = img;
          loadedCount++;
          if (loadedCount === frames.length) renderLoop();
        };
        img.src = src;
      });
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Video too large", description: "Please use a video under 50MB", variant: "destructive" });
      return;
    }
    const tempVideo = document.createElement("video");
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration > 30) {
        toast({ title: "Video too long", description: "Please use a video under 30 seconds for best results", variant: "destructive" });
        URL.revokeObjectURL(tempVideo.src);
        return;
      }
      setTargetVideo(file);
      setTargetVideoUrl(tempVideo.src);
      setResultVideoUrl(null);
      setSwappedFrames([]);
    };
    tempVideo.onerror = () => {
      toast({ title: "Invalid video", description: "Could not load this video file", variant: "destructive" });
    };
  };

  const handleVideoFromUrl = async () => {
    const url = videoUrlInput.trim();
    if (!url) {
      toast({ title: "Enter a URL", description: "Please paste a video URL first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      toast({ title: "Downloading video...", description: "Fetching video from URL" });
      const res = await fetch("/api/proxy-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error || "Failed to download video");
      }
      const contentType = res.headers.get("content-type") || "video/mp4";
      const blob = await res.blob();
      const file = new File([blob], "video-from-url.mp4", { type: contentType });
      
      const tempVideo = document.createElement("video");
      tempVideo.src = URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        setTargetVideo(file);
        setTargetVideoUrl(tempVideo.src);
        setResultVideoUrl(null);
        setSwappedFrames([]);
        setVideoUrlInput("");
        toast({ title: "Video loaded!", description: `Duration: ${Math.round(tempVideo.duration)}s` });
        setLoading(false);
      };
      tempVideo.onerror = () => {
        toast({ title: "Invalid video", description: "The URL didn't return a valid video", variant: "destructive" });
        setLoading(false);
      };
    } catch (err: any) {
      toast({ title: "Failed to load video", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const extractFrames = async (videoFile: File, frameCount: number = 6): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(videoFile);
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error("Video frame extraction timed out"));
      }, 30000);

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video"));
      };

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const frames: string[] = [];
        const interval = duration / (frameCount + 1);
        let currentFrame = 0;

        video.onseeked = () => {
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.min(video.videoHeight, 480);
          const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
          const w = video.videoWidth * scale;
          const h = video.videoHeight * scale;
          ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          frames.push(canvas.toDataURL("image/png"));
          currentFrame++;
          if (currentFrame < frameCount) {
            video.currentTime = interval * (currentFrame + 1);
          } else {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            resolve(frames);
          }
        };

        video.currentTime = interval;
      };
    });
  };

  const handleSwap = async () => {
    if (!targetImage || !faceImage) {
      toast({ title: "Upload both images", description: "Please upload a target photo and your face photo", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const res = await fetch("/api/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetImage, faceImage, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Face swap failed");
      }
      const rawResult = `data:${data.mimeType};base64,${data.b64_json}`;
      const finalResult = await applyWatermarkToImage(rawResult);
      setResultImage(finalResult);
      toast({ title: "Face swap complete!", description: "Your image has been generated" });
    } catch (err: any) {
      toast({ title: "Face swap failed", description: err.message || "Something went wrong. Try different photos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSwap = async () => {
    if (!targetVideo || !faceImage) {
      toast({ title: "Upload video and face", description: "Please upload a target video and your face photo", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultVideoUrl(null);
    setSwappedFrames([]);
    setVideoProgress(0);

    try {
      const frames = await extractFrames(targetVideo, 8);
      setVideoTotalFrames(frames.length);
      const swapped: string[] = [];

      for (let i = 0; i < frames.length; i++) {
        setVideoProgress(i + 1);
        try {
          const res = await fetch("/api/face-swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetImage: frames[i], faceImage, style }),
          });
          const data = await res.json();
          if (res.ok && data.b64_json) {
            swapped.push(`data:${data.mimeType};base64,${data.b64_json}`);
          } else {
            swapped.push(frames[i]);
          }
        } catch {
          swapped.push(frames[i]);
        }
      }

      setSwappedFrames(swapped);

      const blob = await buildSmoothVideo(swapped, applyWatermark);
      setResultVideoUrl(URL.createObjectURL(blob));
      toast({ title: "Video face swap complete!", description: `${swapped.length} frames processed with smooth transitions` });
    } catch (err: any) {
      toast({ title: "Video face swap failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [recreating, setRecreating] = useState(false);
  const [recreateProgress, setRecreateProgress] = useState(0);
  const [recreateTotalFrames, setRecreateTotalFrames] = useState(0);

  const handleRecreateClean = async () => {
    if (!targetVideo && !targetImage) {
      toast({ title: "Upload content first", description: "Upload a video or image to recreate without watermarks", variant: "destructive" });
      return;
    }
    setRecreating(true);
    setResultVideoUrl(null);
    setSwappedFrames([]);
    setResultImage(null);
    setRecreateProgress(0);

    try {
      if (mode === "video" && targetVideo) {
        const frameCount = 8;
        const frames = await extractFrames(targetVideo, frameCount);
        setRecreateTotalFrames(frames.length);
        const cleanFrames: string[] = [];
        let sharedDescription = "";

        for (let i = 0; i < frames.length; i++) {
          setRecreateProgress(i + 1);
          try {
            const body: any = { frameData: frames[i] };
            if (sharedDescription && i > 0) {
              body.description = sharedDescription;
            }
            const res = await fetch("/api/recreate-clean-frame", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok && data.b64_json) {
              if (data.description && !sharedDescription) {
                sharedDescription = data.description;
              }
              const cleanFrame = `data:${data.mimeType};base64,${data.b64_json}`;
              const watermarked = await applyWatermarkToImage(cleanFrame);
              cleanFrames.push(watermarked);
            } else {
              cleanFrames.push(frames[i]);
            }
          } catch {
            cleanFrames.push(frames[i]);
          }
        }

        setSwappedFrames(cleanFrames);
        setRecreateProgress(cleanFrames.length);
        toast({ title: "Building smooth video...", description: "Assembling frames with transitions" });

        const blob = await buildSmoothVideo(cleanFrames, applyWatermark);
        setResultVideoUrl(URL.createObjectURL(blob));
        toast({ title: "Clean video created!", description: `${cleanFrames.length} frames recreated with smooth transitions` });
      } else if (targetImage) {
        const res = await fetch("/api/recreate-clean-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frameData: targetImage }),
        });
        const data = await res.json();
        if (res.ok && data.b64_json) {
          const cleanResult = `data:${data.mimeType};base64,${data.b64_json}`;
          const finalResult = await applyWatermarkToImage(cleanResult);
          setResultImage(finalResult);
          toast({ title: "Clean image created!", description: "AI recreated the image without watermarks" });
        } else {
          throw new Error(data.error || "Could not recreate image");
        }
      }
    } catch (err: any) {
      toast({ title: "Recreate failed", description: err.message, variant: "destructive" });
    } finally {
      setRecreating(false);
    }
  };

  const downloadResult = () => {
    if (mode === "video" && resultVideoUrl) {
      const link = document.createElement("a");
      link.download = `face-swap-video-${Date.now()}.webm`;
      link.href = resultVideoUrl;
      link.click();
      return;
    }
    if (!resultImage) return;
    const link = document.createElement("a");
    link.download = `face-swap-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <UserCheck className="h-5 w-5" /> AI Face Swap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
            <p className="text-xs text-cyan-300/80">Swap the complete face including hair! Upload a target photo/video and your face photo. AI replaces the entire head.</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mode === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("image"); setResultVideoUrl(null); setSwappedFrames([]); }}
              className={mode === "image" ? "bg-cyan-600 hover:bg-cyan-700 flex-1" : "border-slate-600 text-gray-400 flex-1"}
              data-testid="button-mode-image"
            >
              <ImageIcon className="h-4 w-4 mr-1" /> Image
            </Button>
            <Button
              variant={mode === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("video"); setResultImage(null); }}
              className={mode === "video" ? "bg-orange-600 hover:bg-orange-700 flex-1" : "border-slate-600 text-gray-400 flex-1"}
              data-testid="button-mode-video"
            >
              <Video className="h-4 w-4 mr-1" /> Video
            </Button>
          </div>

          {mode === "image" ? (
            <div className="space-y-3">
              <Label className="text-gray-300 text-sm font-medium">Step 1: Target Photo</Label>
              <input type="file" accept="image/*" ref={targetInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setTargetImage)} className="hidden" data-testid="input-target-image" />
              <div
                onClick={() => targetInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 transition-colors min-h-[120px] flex flex-col items-center justify-center"
                data-testid="dropzone-target-image"
              >
                {targetImage ? (
                  <div className="relative w-full">
                    <img src={targetImage} alt="Target" className="max-h-36 mx-auto rounded-lg object-contain" />
                    <Button size="sm" variant="destructive" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setTargetImage(null); }} data-testid="button-remove-target">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-500 mb-1" />
                    <p className="text-sm text-slate-400">Upload target photo</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-gray-300 text-sm font-medium">Step 1: Target Video</Label>
              <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" data-testid="input-target-video" />
              
              {!targetVideoUrl && (
                <div className="flex gap-2 mb-2" data-testid="video-url-input-section">
                  <Input
                    placeholder="Paste video URL here..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-sm"
                    data-testid="input-video-url"
                  />
                  <Button
                    size="sm"
                    onClick={handleVideoFromUrl}
                    disabled={loading || !videoUrlInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    data-testid="button-load-video-url"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    <span className="ml-1">Load</span>
                  </Button>
                </div>
              )}

              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 transition-colors min-h-[120px] flex flex-col items-center justify-center"
                data-testid="dropzone-target-video"
              >
                {targetVideoUrl ? (
                  <div className="relative w-full">
                    <video src={targetVideoUrl} className="max-h-36 mx-auto rounded-lg" controls muted />
                    <Button size="sm" variant="destructive" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setTargetVideo(null); setTargetVideoUrl(null); }} data-testid="button-remove-video">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Video className="h-6 w-6 text-slate-500 mb-1" />
                    <p className="text-sm text-slate-400">Upload video file or paste URL above</p>
                    <p className="text-xs text-slate-500 mt-1">Short clips work best (5-15 seconds)</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-gray-300 text-sm font-medium">Step 2: Your Face Photo</Label>
            <input type="file" accept="image/*" ref={faceInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setFaceImage)} className="hidden" data-testid="input-face-image" />
            <div
              onClick={() => faceInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 transition-colors min-h-[120px] flex flex-col items-center justify-center"
              data-testid="dropzone-face-image"
            >
              {faceImage ? (
                <div className="relative w-full">
                  <img src={faceImage} alt="Face" className="max-h-36 mx-auto rounded-lg object-contain" />
                  <Button size="sm" variant="destructive" className="absolute top-1 right-1 h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setFaceImage(null); }} data-testid="button-remove-face">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-500 mb-1" />
                  <p className="text-sm text-slate-400">Upload your face photo</p>
                  <p className="text-xs text-slate-500 mt-1">Clear front-facing photo with hair visible</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-face-swap-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic (Photo-like)</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="cartoon">Cartoon / Fun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-slate-700 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                <Type className="h-4 w-4" /> Custom Watermark
              </Label>
              <button
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${watermarkEnabled ? "bg-cyan-600" : "bg-slate-600"}`}
                data-testid="toggle-watermark"
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${watermarkEnabled ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {watermarkEnabled && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setWatermarkType("text")}
                    className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${watermarkType === "text" ? "bg-cyan-600 text-white" : "bg-slate-700 text-gray-400 hover:bg-slate-600"}`}
                    data-testid="btn-watermark-text"
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setWatermarkType("image")}
                    className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${watermarkType === "image" ? "bg-cyan-600 text-white" : "bg-slate-700 text-gray-400 hover:bg-slate-600"}`}
                    data-testid="btn-watermark-image"
                  >
                    Logo / Image
                  </button>
                </div>

                {watermarkType === "text" ? (
                  <div className="space-y-2">
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Your watermark text..."
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                      data-testid="input-watermark-text"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-400 text-xs whitespace-nowrap">Size: {watermarkSize}px</Label>
                      <input type="range" min={12} max={72} value={watermarkSize} onChange={(e) => setWatermarkSize(Number(e.target.value))} className="flex-1 accent-cyan-500" data-testid="range-watermark-size" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watermarkImage ? (
                      <div className="relative inline-block">
                        <img src={watermarkImage} alt="Watermark" className="h-12 object-contain rounded border border-slate-600" />
                        <button onClick={() => setWatermarkImage(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">x</button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors" data-testid="btn-upload-watermark">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Upload watermark image/logo</span>
                        <input ref={watermarkInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { const r = new FileReader(); r.onload = () => setWatermarkImage(r.result as string); r.readAsDataURL(f); }
                          if (e.target) e.target.value = "";
                        }} />
                      </label>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-gray-400 text-xs">Position</Label>
                    <Select value={watermarkPosition} onValueChange={(v: any) => setWatermarkPosition(v)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-xs h-8" data-testid="select-watermark-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">Opacity: {watermarkOpacity}%</Label>
                    <input type="range" min={10} max={100} value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="w-full accent-cyan-500 mt-1" data-testid="range-watermark-opacity" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={mode === "image" ? handleSwap : handleVideoSwap}
            disabled={(mode === "image" ? !targetImage : !targetVideo) || !faceImage || loading || recreating}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3"
            data-testid="button-swap-face"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "video" ? `Processing frame ${videoProgress}/${videoTotalFrames}...` : "AI is swapping face... (30-60 seconds)"}
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" /> {mode === "video" ? "Swap Face in Video" : "Swap Face Now"}
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-900 px-3 text-xs text-gray-500">OR</span></div>
          </div>

          <Button
            onClick={handleRecreateClean}
            disabled={(mode === "image" ? !targetImage : !targetVideo) || loading || recreating}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3"
            data-testid="button-recreate-clean"
          >
            {recreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "video" ? `Recreating frame ${recreateProgress}/${recreateTotalFrames}...` : "AI is recreating clean version..."}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> {mode === "video" ? "Recreate Clean Video (No Watermark)" : "Recreate Clean Image (No Watermark)"}
              </>
            )}
          </Button>
          <p className="text-[10px] text-gray-500 text-center -mt-1">AI generates a similar new {mode === "video" ? "video" : "image"} without any watermarks — no face photo needed</p>

          <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
            <p className="text-xs text-gray-400 font-medium">Tips for best results:</p>
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc pl-4">
              <li>Complete head including hair will be swapped</li>
              <li>Use a clear photo with full face and hair visible</li>
              <li>Similar face angles between photos give better results</li>
              {mode === "video" && <li>Short videos (5-15 seconds) work best - 8 key frames will be extracted</li>}
              {mode === "video" && <li>Video processing takes 3-5 minutes as each frame is AI-processed</li>}
              <li className="text-emerald-400/70">Use "Recreate Clean" to generate a similar AI version without any watermarks</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-300 flex items-center justify-between">
            <span>Result</span>
            {(resultImage || resultVideoUrl) && (
              <Button size="sm" onClick={downloadResult} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-download-face-swap">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(loading || recreating) ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className={`h-16 w-16 rounded-full border-4 ${recreating ? 'border-emerald-500/30 border-t-emerald-500' : 'border-cyan-500/30 border-t-cyan-500'} animate-spin`} />
                <UserCheck className={`h-6 w-6 ${recreating ? 'text-emerald-400' : 'text-cyan-400'} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
              </div>
              <p className={`${recreating ? 'text-emerald-400' : 'text-cyan-400'} font-medium`}>
                {recreating
                  ? (mode === "video" ? `Recreating clean frame ${recreateProgress} of ${recreateTotalFrames}...` : "AI is recreating clean version...")
                  : (mode === "video" ? `Processing frame ${videoProgress} of ${videoTotalFrames}...` : "AI is working on your face swap...")}
              </p>
              <p className="text-xs text-gray-500">
                {mode === "video" ? "Each frame takes 30-60 seconds" : "This may take 30-60 seconds"}
              </p>
              {mode === "video" && (recreating ? recreateTotalFrames : videoTotalFrames) > 0 && (
                <div className="w-full max-w-xs">
                  <div className="bg-slate-700 rounded-full h-2">
                    <div className={`${recreating ? 'bg-emerald-500' : 'bg-cyan-500'} rounded-full h-2 transition-all`} style={{ width: `${((recreating ? recreateProgress : videoProgress) / (recreating ? recreateTotalFrames : videoTotalFrames)) * 100}%` }} />
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-1">{Math.round(((recreating ? recreateProgress : videoProgress) / (recreating ? recreateTotalFrames : videoTotalFrames)) * 100)}%</p>
                </div>
              )}
            </div>
          ) : resultVideoUrl ? (
            <div className="space-y-4">
              <video src={resultVideoUrl} controls autoPlay loop className="w-full rounded-lg border border-slate-700" data-testid="video-face-swap-result" />
              {swappedFrames.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Processed Frames ({swappedFrames.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {swappedFrames.map((frame, i) => (
                      <img key={i} src={frame} alt={`Frame ${i + 1}`} className="w-full h-16 object-cover rounded border border-slate-700" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : resultImage ? (
            <div className="space-y-4">
              <img src={resultImage} alt="Face Swap Result" className="w-full rounded-lg border border-slate-700" data-testid="img-face-swap-result" />
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Target</p>
                  {targetImage && <img src={targetImage} alt="Target" className="h-20 mx-auto rounded object-contain opacity-60" />}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Your Face</p>
                  {faceImage && <img src={faceImage} alt="Face" className="h-20 mx-auto rounded object-contain opacity-60" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <UserCheck className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">Upload {mode === "video" ? "a video" : "a photo"} and your face, then click swap</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}