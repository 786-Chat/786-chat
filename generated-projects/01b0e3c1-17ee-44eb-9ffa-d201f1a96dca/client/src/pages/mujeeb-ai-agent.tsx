import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Volume2, VolumeX, Play, Pause, ChevronLeft, ChevronRight,
  Phone, Globe, Code, Server, Rocket, Settings, Upload, Image, Film,
  Music, Type, Download, Send, Link, Youtube, PanelLeftOpen, PanelLeftClose,
  Trash2, Plus, GripVertical, Eye, Sparkles, MessageSquare
} from "lucide-react";

interface SlideData {
  text: string;
  subtext: string;
  voice: string;
  mediaType: "image" | "video" | "gif" | "youtube";
  mediaSrc: string;
  animation: "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce" | "none";
  features?: string[];
}

const defaultSlides: SlideData[] = [
  {
    text: "Welcome to Link24.online",
    subtext: "Hi, I'm Mujeeb — Your AI Agent",
    voice: "Welcome to Link 24 dot online. Hi, I'm Mujeeb, Your AI Agent.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-1.png",
    animation: "fadeIn",
  },
  {
    text: "No coding. No big teams. No waiting for months.",
    subtext: "Just tell me your idea.",
    voice: "No coding. No big teams. No waiting for months. Just tell me your idea.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-2.png",
    animation: "slideUp",
  },
  {
    text: "Describe your vibe, your features, or even a simple thought from your notes — anytime, 24 hours a day.",
    subtext: "Send me any website link… I can recreate the same functions for your own brand.",
    voice: "Describe your vibe, your features, or even a simple thought from your notes, anytime, 24 hours a day. Send me any website link, I can recreate the same functions for your own brand.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-3.png",
    animation: "slideLeft",
  },
  {
    text: "While you're still explaining your idea —",
    subtext: "I'm already building your Front-End, your Back-End, your Live Web App.",
    voice: "While you're still explaining your idea, I'm already building your Front End, your Back End, your Live Web App.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-4.png",
    animation: "zoomIn",
    features: ["Your Front-End", "Your Back-End", "Your Live Web App"],
  },
  {
    text: "Fast. Simple. Powerful.",
    subtext: "If you can describe it… I can deploy it.",
    voice: "Fast. Simple. Powerful. If you can describe it, I can deploy it.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-5.png",
    animation: "bounce",
  },
  {
    text: "Launch your web app today with Link24.online",
    subtext: "Contact: +447427070000",
    voice: "Launch your web app today with Link 24 dot online. Contact us at plus 4 4 7 4 2 7 0 7 0 0 0 0.",
    mediaType: "image",
    mediaSrc: "/images/mujeeb-robot-6.png",
    animation: "fadeIn",
  },
];

const animationVariants: Record<string, { initial: any; animate: any }> = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  slideLeft: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
  zoomIn: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
  bounce: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } },
  none: { initial: {}, animate: {} },
};

function MediaDisplay({ slide }: { slide: SlideData }) {
  const anim = animationVariants[slide.animation] || animationVariants.fadeIn;

  if (!slide.mediaSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center text-white/30">
          <Upload className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Upload media</p>
        </div>
      </div>
    );
  }

  if (slide.mediaType === "video") {
    return (
      <motion.div
        key={slide.mediaSrc}
        className="w-full h-full"
        {...anim}
        transition={{ duration: 0.6 }}
      >
        <video
          src={slide.mediaSrc}
          className="w-full h-full object-contain"
          autoPlay loop muted playsInline
        />
      </motion.div>
    );
  }

  if (slide.mediaType === "youtube") {
    const videoId = slide.mediaSrc.match(/(?:youtu\.be\/|v=)([^&]+)/)?.[1] || slide.mediaSrc;
    return (
      <motion.div
        key={slide.mediaSrc}
        className="w-full h-full"
        {...anim}
        transition={{ duration: 0.6 }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
          className="w-full h-full"
          allow="autoplay"
        />
      </motion.div>
    );
  }

  return (
    <motion.img
      key={slide.mediaSrc}
      src={slide.mediaSrc}
      alt="Slide media"
      className="w-full h-full object-contain"
      {...anim}
      transition={{ duration: 0.6 }}
    />
  );
}

function Sidebar({
  slides, setSlides, currentSlide, setCurrentSlide,
  brandName, setBrandName, whatsapp, setWhatsapp,
  voiceEnabled, setVoiceEnabled, bgMusic, setBgMusic,
  sidebarOpen, setSidebarOpen,
  voiceGender, setVoiceGender,
}: {
  slides: SlideData[]; setSlides: (s: SlideData[]) => void;
  currentSlide: number; setCurrentSlide: (n: number) => void;
  brandName: string; setBrandName: (s: string) => void;
  whatsapp: string; setWhatsapp: (s: string) => void;
  voiceEnabled: boolean; setVoiceEnabled: (b: boolean) => void;
  bgMusic: string; setBgMusic: (s: string) => void;
  sidebarOpen: boolean; setSidebarOpen: (b: boolean) => void;
  voiceGender: "male" | "female"; setVoiceGender: (g: "male" | "female") => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"image" | "video" | "gif">("image");
  const slide = slides[currentSlide];

  const updateSlide = (field: keyof SlideData, value: any) => {
    const updated = [...slides];
    updated[currentSlide] = { ...updated[currentSlide], [field]: value };
    setSlides(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const updated = [...slides];
    updated[currentSlide] = { ...updated[currentSlide], mediaSrc: url, mediaType: uploadType };
    setSlides(updated);
    e.target.value = "";
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgMusic(URL.createObjectURL(file));
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      text: "New Slide",
      subtext: "Add your content here",
      voice: "New slide content",
      mediaType: "image",
      mediaSrc: "",
      animation: "fadeIn",
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    if (currentSlide >= updated.length) setCurrentSlide(updated.length - 1);
  };

  const generateVoice = () => {
    const text = slide.text + ". " + slide.subtext;
    updateSlide("voice", text);
  };

  if (!sidebarOpen) return null;

  return (
    <div className="w-[320px] h-full bg-gray-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden z-20" data-testid="sidebar">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" /> Studio Controls
        </h2>
        <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded" data-testid="button-close-sidebar">
          <PanelLeftClose className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Brand Info</label>
          <input
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="Brand / Agent Name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
            data-testid="input-brand-name"
          />
          <input
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="WhatsApp Number"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
            data-testid="input-whatsapp"
          />
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Slides ({slides.length})</label>
            <button onClick={addSlide} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300" data-testid="button-add-slide">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {slides.map((s, i) => (
              <div key={i}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${i === currentSlide ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-white/60 hover:bg-white/5"}`}
                onClick={() => setCurrentSlide(i)}
                data-testid={`slide-item-${i}`}
              >
                <GripVertical className="w-3 h-3 opacity-30" />
                <span className="flex-1 truncate">{i + 1}. {s.text.slice(0, 25)}...</span>
                {slides.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeSlide(i); }} className="p-0.5 hover:text-red-400" data-testid={`button-remove-slide-${i}`}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
            <Type className="w-3 h-3" /> Slide {currentSlide + 1} Content
          </label>
          <textarea
            value={slide.text}
            onChange={e => updateSlide("text", e.target.value)}
            placeholder="Main text"
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none resize-none"
            data-testid="input-slide-text"
          />
          <textarea
            value={slide.subtext}
            onChange={e => updateSlide("subtext", e.target.value)}
            placeholder="Subtitle"
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none resize-none"
            data-testid="input-slide-subtext"
          />
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
            <Upload className="w-3 h-3" /> Media Upload
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(["image", "video", "gif"] as const).map(type => (
              <button key={type}
                onClick={() => { setUploadType(type); fileInputRef.current?.click(); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all ${slide.mediaType === type ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                data-testid={`button-upload-${type}`}
              >
                {type === "image" ? <Image className="w-4 h-4" /> : type === "video" ? <Film className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {type.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => {
                const url = prompt("Paste YouTube URL:");
                if (url) { const updated = [...slides]; updated[currentSlide] = { ...updated[currentSlide], mediaSrc: url, mediaType: "youtube" }; setSlides(updated); }
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all ${slide.mediaType === "youtube" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
              data-testid="button-upload-youtube"
            >
              <Youtube className="w-4 h-4" />
              YOUTUBE
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden"
            accept={uploadType === "image" ? "image/*" : uploadType === "video" ? "video/*" : "image/gif"}
            onChange={handleFileUpload} />
          {slide.mediaSrc && (
            <div className="text-[10px] text-green-400/70 truncate">Current: {slide.mediaSrc.includes("blob:") ? "Uploaded file" : slide.mediaSrc}</div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Animation
          </label>
          <select
            value={slide.animation}
            onChange={e => updateSlide("animation", e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
            data-testid="select-animation"
          >
            <option value="fadeIn">Fade In</option>
            <option value="slideUp">Slide Up</option>
            <option value="slideLeft">Slide Left</option>
            <option value="zoomIn">Zoom In</option>
            <option value="bounce">Bounce</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Voice & Audio
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${voiceEnabled ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}
              data-testid="button-toggle-voice"
            >
              {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              Voice {voiceEnabled ? "ON" : "OFF"}
            </button>
            <button onClick={() => musicInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all"
              data-testid="button-upload-music"
            >
              <Music className="w-3 h-3" /> Music
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceGender("male")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${voiceGender === "male" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}
              data-testid="button-voice-male"
            >
              Man
            </button>
            <button onClick={() => setVoiceGender("female")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${voiceGender === "female" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}
              data-testid="button-voice-female"
            >
              Woman
            </button>
          </div>
          <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
          {bgMusic && (
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-green-400/70">Background music loaded</div>
              <button onClick={() => setBgMusic("")}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                data-testid="button-remove-music"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          )}
          <textarea
            value={slide.voice}
            onChange={e => updateSlide("voice", e.target.value)}
            placeholder="Voice text (paste text here for auto TTS)"
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none resize-none"
            data-testid="input-voice-text"
          />
          <button onClick={generateVoice} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-500/30 transition-all" data-testid="button-generate-voice">
            <MessageSquare className="w-3 h-3" /> Auto-Generate from Text
          </button>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1">
            <Send className="w-3 h-3" /> Share & Export
          </label>
          <button
            onClick={() => {
              const link = window.location.href;
              navigator.clipboard.writeText(link);
              alert("Link copied! Share this with your marketing team.");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold hover:bg-green-500/30 transition-all"
            data-testid="button-copy-link"
          >
            <Link className="w-3 h-3" /> Copy Share Link
          </button>
          <button
            onClick={() => {
              if (whatsapp) {
                const msg = encodeURIComponent(`Check out our presentation: ${window.location.href}`);
                window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
              } else {
                alert("Please enter a WhatsApp number first.");
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-all"
            data-testid="button-send-whatsapp"
          >
            <Phone className="w-3 h-3" /> Send via WhatsApp
          </button>
          <button
            onClick={async () => {
              const toDataUrl = async (url: string): Promise<string> => {
                if (!url || url.startsWith("data:")) return url;
                if (url.startsWith("http") && !url.startsWith(window.location.origin)) return url;
                try {
                  const resp = await fetch(url);
                  const blob = await resp.blob();
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                } catch { return url; }
              };

              const resolvedMedia = await Promise.all(slides.map(s => toDataUrl(s.mediaSrc)));

              const getYoutubeId = (url: string) => {
                const m = url.match(/(?:youtu\.be\/|v=)([^&]+)/);
                return m ? m[1] : url;
              };
              const getMediaHtml = (src: string, s: SlideData, idx: number) => {
                if (s.mediaType === "video") return '<video src="' + src + '" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:contain;"></video>';
                if (s.mediaType === "youtube") return '<iframe src="https://www.youtube.com/embed/' + getYoutubeId(s.mediaSrc) + '" style="width:100%;height:100%;border:none;" allow="autoplay"></iframe>';
                return '<img src="' + src + '" alt="Slide ' + (idx + 1) + '" style="width:100%;height:100%;object-fit:contain;" />';
              };
              const getFeaturesHtml = (s: SlideData) => {
                if (!s.features) return '';
                return s.features.map(f => '<div class="feature">&#10003; ' + f + '</div>').join('');
              };
              const mLogoHtml = '<div style="position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);z-index:10;pointer-events:none"><div style="width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#0a0a0a 50%,#1a1a2e 70%,#2d2d44 85%,transparent 100%);box-shadow:0 0 20px rgba(0,0,0,0.9)"><span style="color:#fff;font-weight:900;font-size:34px;font-family:Arial,sans-serif;text-shadow:0 0 15px rgba(255,255,255,0.8),0 0 30px rgba(59,130,246,0.6)">M</span></div></div>';
              const slidesHtml = slides.map((s, i) =>
                '<div class="slide" id="slide-' + i + '" style="display:' + (i === 0 ? 'flex' : 'none') + '">' +
                '<div class="media-box" style="position:relative">' + getMediaHtml(resolvedMedia[i], s, i) + mLogoHtml + '</div>' +
                '<div class="text-box"><h1>' + s.text + '</h1><p>' + s.subtext + '</p>' + getFeaturesHtml(s) + '</div>' +
                '</div>'
              ).join('\n');

              const html = '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + brandName + ' - Presentation</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{background:#000;color:#fff;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;height:100vh}\n.container{height:100vh;display:flex;flex-direction:column}\n.header{padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05)}\n.brand{font-weight:bold;font-size:1.2rem;background:linear-gradient(90deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.main{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}\n.slide{display:flex;align-items:center;gap:48px;max-width:900px;width:100%}\n.media-box{width:340px;height:480px;border-radius:16px;overflow:hidden;background:#0b0c11;flex-shrink:0;position:relative}\n.text-box{flex:1}\n.text-box h1{font-size:2.2rem;font-weight:900;line-height:1.2;margin-bottom:16px}\n.text-box p{font-size:1.1rem;color:rgba(255,255,255,0.7);margin-bottom:16px}\n.feature{display:flex;align-items:center;gap:8px;padding:8px 0;font-weight:600}\n.controls{padding:16px 24px;display:flex;justify-content:center;align-items:center;gap:12px;border-top:1px solid rgba(255,255,255,0.05)}\n.btn{padding:10px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;font-size:14px}\n.btn:hover{background:rgba(255,255,255,0.1)}\n.btn-play{background:rgba(59,130,246,0.2);border-color:rgba(59,130,246,0.3);color:#60a5fa}\n.dots{display:flex;gap:8px}\n.dot{width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.2);cursor:pointer}\n.dot.active{width:32px;border-radius:6px;background:linear-gradient(90deg,#60a5fa,#a78bfa)}\n</style></head><body>\n<div class="container">\n<div class="header">\n  <span class="brand">' + brandName + '</span>\n  <button class="btn btn-play" onclick="togglePlay()">&#9654; Play</button>\n</div>\n<div class="main">' + slidesHtml + '</div>\n<div class="controls">\n  <button class="btn" onclick="goSlide(-1)">&#9664; Prev</button>\n  <div class="dots">' + slides.map((_, i) => '<div class="dot ' + (i === 0 ? 'active' : '') + '" onclick="showSlide(' + i + ')"></div>').join('') + '</div>\n  <button class="btn" onclick="goSlide(1)">Next &#9654;</button>\n</div>\n</div>\n<script>\nlet cur=0,total=' + slides.length + ',playing=false,timer=null;\nconst voices=' + JSON.stringify(slides.map(s => s.voice)) + ';\nfunction showSlide(n){document.querySelectorAll(".slide").forEach(function(s,i){s.style.display=i===n?"flex":"none"});\ndocument.querySelectorAll(".dot").forEach(function(d,i){d.className=i===n?"dot active":"dot"});cur=n;}\nfunction goSlide(d){showSlide(Math.max(0,Math.min(total-1,cur+d)))}\nfunction speak(i){if(!window.speechSynthesis)return;speechSynthesis.cancel();\nvar u=new SpeechSynthesisUtterance(voices[i]);u.lang="en-US";u.rate=0.9;\nu.onend=function(){if(playing&&cur<total-1){timer=setTimeout(function(){showSlide(cur+1);speak(cur)},1500)}else{playing=false}};\nspeechSynthesis.speak(u)}\nfunction togglePlay(){if(playing){playing=false;speechSynthesis.cancel();clearTimeout(timer)}else{playing=true;showSlide(0);speak(0)}}\n</script></body></html>';
              const blob = new Blob([html], { type: "text/html" });
              const dlUrl = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = dlUrl; a.download = (brandName || "mujeeb") + "-presentation.html"; a.click();
              URL.revokeObjectURL(dlUrl);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 transition-all"
            data-testid="button-download"
          >
            <Download className="w-3 h-3" /> Download Presentation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MujeebAIAgent() {
  const [, setLocation] = useLocation();
  const [slides, setSlides] = useState<SlideData[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");
  const [brandName, setBrandName] = useState("Mujeeb AI");
  const [whatsapp, setWhatsapp] = useState("+447427070000");
  const [bgMusic, setBgMusic] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (bgMusic) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = bgMusic;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [bgMusic]);

  const speakSlide = useCallback((index: number) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(slides[index].voice);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = voiceGender === "female" ? 1.1 : 0.8;
    const voices = synthRef.current.getVoices();
    let selectedVoice;
    if (voiceGender === "female") {
      selectedVoice = voices.find(v => v.name.includes("Google") && v.name.includes("Female")) ||
        voices.find(v => v.name.includes("Samantha")) ||
        voices.find(v => v.name.includes("Karen")) ||
        voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
        voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("woman")) ||
        voices.find(v => v.lang.startsWith("en"));
    } else {
      selectedVoice = voices.find(v => v.name.includes("Google") && v.name.includes("Male")) ||
        voices.find(v => v.name.includes("Daniel")) ||
        voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ||
        voices.find(v => v.lang.startsWith("en"));
    }
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (autoPlay && index < slides.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentSlide(prev => {
            const next = prev + 1;
            if (next < slides.length) return next;
            setAutoPlay(false);
            setIsPlaying(false);
            return prev;
          });
        }, 1500);
      } else if (index >= slides.length - 1) {
        setAutoPlay(false);
        setIsPlaying(false);
      }
    };
    synthRef.current.speak(utterance);
  }, [voiceEnabled, autoPlay, slides, voiceGender]);

  useEffect(() => {
    if (autoPlay) speakSlide(currentSlide);
  }, [currentSlide, autoPlay, speakSlide]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setAutoPlay(false);
      setIsSpeaking(false);
      if (synthRef.current) synthRef.current.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      setAutoPlay(true);
      setCurrentSlide(0);
      if (audioRef.current && bgMusic) audioRef.current.play().catch(() => {});
    }
  };

  const goToSlide = (dir: "next" | "prev") => {
    if (synthRef.current) synthRef.current.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);
    setAutoPlay(false);
    setIsPlaying(false);
    setIsSpeaking(false);
    setCurrentSlide(prev => {
      if (dir === "next") return Math.min(prev + 1, slides.length - 1);
      return Math.max(prev - 1, 0);
    });
  };

  const slide = slides[currentSlide];

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex" data-testid="mujeeb-ai-page">
      <Sidebar
        slides={slides} setSlides={setSlides}
        currentSlide={currentSlide} setCurrentSlide={setCurrentSlide}
        brandName={brandName} setBrandName={setBrandName}
        whatsapp={whatsapp} setWhatsapp={setWhatsapp}
        voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled}
        bgMusic={bgMusic} setBgMusic={setBgMusic}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        voiceGender={voiceGender} setVoiceGender={setVoiceGender}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-toggle-sidebar">
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4 text-white/60" /> : <PanelLeftOpen className="h-4 w-4 text-white/60" />}
            </button>
            <button onClick={() => setLocation("/portal")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" /> <span className="text-sm hidden sm:inline">Portal</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{brandName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="button-voice-toggle-top">
              {voiceEnabled ? <Volume2 className="h-4 w-4 text-blue-400" /> : <VolumeX className="h-4 w-4 text-white/40" />}
            </button>
            <button onClick={handlePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isPlaying ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"}`}
              data-testid="button-play-presentation">
              {isPlaying ? <><Pause className="h-4 w-4" /> Stop</> : <><Play className="h-4 w-4" /> Play</>}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={`media-${currentSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative flex-shrink-0 w-[240px] h-[340px] sm:w-[280px] sm:h-[400px] lg:w-[340px] lg:h-[480px] rounded-2xl overflow-hidden bg-[#0b0c11]"
            >
              <div className="absolute inset-0 z-[1]">
                <MediaDisplay slide={slide} />
              </div>

              <div className="absolute top-0 right-0 w-[140px] h-[50px] z-10 pointer-events-none"
                style={{ background: "linear-gradient(135deg, transparent 0%, #0b0c11 30%, #0b0c11 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 h-[60px] z-[5] pointer-events-none"
                style={{ background: "linear-gradient(to top, #0b0c11 30%, transparent 100%)" }} />

              <div className="absolute z-10 pointer-events-none flex items-center justify-center"
                style={{ top: "30%", left: "50%", transform: "translate(-50%, -50%)" }}>
                <motion.div
                  animate={isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: isSpeaking ? 0.6 : 2, repeat: Infinity }}
                  className="relative"
                >
                  <div className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] lg:w-[62px] lg:h-[62px] rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle, #0a0a0a 50%, #1a1a2e 70%, #2d2d44 85%, transparent 100%)",
                      boxShadow: "0 0 20px rgba(0,0,0,0.9)",
                    }}>
                    <span className="text-white font-black text-[24px] sm:text-[28px] lg:text-[34px] select-none"
                      style={{
                        textShadow: "0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(59,130,246,0.6)",
                        fontFamily: "Arial, sans-serif",
                      }}>
                      M
                    </span>
                  </div>
                  <motion.div
                    className="absolute inset-[-4px] rounded-full"
                    style={{ border: "1.5px solid rgba(255,255,255,0.25)" }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.4, 0.15] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </motion.div>
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI AGENT</span>
              </div>

              {isSpeaking && (
                <motion.div className="absolute bottom-3 right-3 z-10 flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}>
                  {[1, 2, 3, 4].map(i => (
                    <motion.div key={i} className="w-[3px] bg-blue-400 rounded-full"
                      animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={`text-${currentSlide}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex-1 min-w-0 max-w-md text-center lg:text-left pr-4">
              <motion.h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-4" style={{ textShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
                {slide.text.split(" ").map((word, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="inline-block mr-2">
                    {word.includes("Link24") || word.includes("Mujeeb") ? (
                      <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">{word}</span>
                    ) : word.includes("AI") ? (
                      <span className="text-blue-400">{word}</span>
                    ) : word}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg sm:text-xl text-white/70 mb-6 leading-relaxed">
                {slide.subtext}
              </motion.p>

              {slide.features && (
                <motion.div className="space-y-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                  {slide.features.map((f, i) => (
                    <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.2 }} className="flex items-center gap-3">
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/30 flex items-center justify-center">
                        {i === 0 ? <Code className="h-4 w-4 text-blue-400" /> : i === 1 ? <Server className="h-4 w-4 text-purple-400" /> : <Rocket className="h-4 w-4 text-cyan-400" />}
                      </motion.div>
                      <span className="text-white font-semibold text-lg">{f}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {currentSlide === slides.length - 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a href="https://link24.online" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all" data-testid="link-launch-app">
                    <Globe className="h-5 w-5" /> Link24.online
                  </a>
                  <a href={`tel:${whatsapp}`} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all" data-testid="link-contact">
                    <Phone className="h-5 w-5" /> {whatsapp}
                  </a>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/60 backdrop-blur-xl border-t border-white/5">
          <button onClick={() => goToSlide("prev")} disabled={currentSlide === 0} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10" data-testid="button-prev-slide">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { setCurrentSlide(i); setAutoPlay(false); setIsPlaying(false); setIsSpeaking(false); if (synthRef.current) synthRef.current.cancel(); }}
                className={`transition-all rounded-full ${i === currentSlide ? "w-8 h-3 bg-gradient-to-r from-blue-400 to-purple-400" : "w-3 h-3 bg-white/20 hover:bg-white/40"}`}
                data-testid={`dot-slide-${i}`} />
            ))}
          </div>
          <button onClick={() => goToSlide("next")} disabled={currentSlide === slides.length - 1} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10" data-testid="button-next-slide">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, background: `rgba(${Math.random() > 0.5 ? "59,130,246" : "139,92,246"},${Math.random() * 0.3 + 0.1})`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: Math.random() * 5 + 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/10" />
      </div>
    </div>
  );
}
