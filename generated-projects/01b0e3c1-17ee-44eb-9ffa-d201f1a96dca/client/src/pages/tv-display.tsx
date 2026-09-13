import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { Star, Loader2 } from "lucide-react";

const DESIGN_TEMPLATES: Record<string, any> = {
  "chunky-red": { sectionTitleColor: "#FF0000", sectionTitleFont: "Impact", sectionBgColor: "rgba(20,0,0,0.8)", sectionBorderColor: "#CC0000", itemNameColor: "#FFFFFF", itemPriceColor: "#FFD700", itemDescColor: "#cccccc", itemNameFont: "Arial" },
  "pizza-dark": { sectionTitleColor: "#FFFFFF", sectionTitleFont: "Georgia", sectionBgColor: "rgba(10,15,40,0.85)", sectionBorderColor: "#333366", itemNameColor: "#E0E0E0", itemPriceColor: "#FF4444", itemDescColor: "#999999", itemNameFont: "Georgia" },
  "light-clean": { sectionTitleColor: "#CC0000", sectionTitleFont: "Arial", sectionBgColor: "rgba(255,255,255,0.95)", sectionBorderColor: "#dddddd", itemNameColor: "#222222", itemPriceColor: "#CC0000", itemDescColor: "#666666", itemNameFont: "Arial" },
  "grilled-dark": { sectionTitleColor: "#FF6B00", sectionTitleFont: "Impact", sectionBgColor: "rgba(30,30,30,0.9)", sectionBorderColor: "#444444", itemNameColor: "#FFFFFF", itemPriceColor: "#FF6B00", itemDescColor: "#aaaaaa", itemNameFont: "Arial" },
  "taco-bell": { sectionTitleColor: "#A855F7", sectionTitleFont: "Arial", sectionBgColor: "rgba(26,26,46,0.9)", sectionBorderColor: "#6B21A8", itemNameColor: "#E0E0E0", itemPriceColor: "#A855F7", itemDescColor: "#888888", itemNameFont: "Arial" },
  "golden-luxury": { sectionTitleColor: "#FFD700", sectionTitleFont: "Georgia", sectionBgColor: "rgba(15,15,5,0.9)", sectionBorderColor: "#DAA520", itemNameColor: "#F5F5DC", itemPriceColor: "#FFD700", itemDescColor: "#aa9966", itemNameFont: "Georgia" },
  "neon-green": { sectionTitleColor: "#00FF88", sectionTitleFont: "Impact", sectionBgColor: "rgba(10,30,10,0.9)", sectionBorderColor: "#00CC66", itemNameColor: "#E0FFE0", itemPriceColor: "#00FF88", itemDescColor: "#88bb88", itemNameFont: "Arial" },
  "seafood-cyan": { sectionTitleColor: "#00E5FF", sectionTitleFont: "Georgia", sectionBgColor: "rgba(10,25,41,0.9)", sectionBorderColor: "#0097A7", itemNameColor: "#E0F7FA", itemPriceColor: "#00E5FF", itemDescColor: "#80DEEA", itemNameFont: "Georgia" },
  "warm-wood": { sectionTitleColor: "#FFB74D", sectionTitleFont: "Georgia", sectionBgColor: "rgba(35,20,8,0.9)", sectionBorderColor: "#8D6E63", itemNameColor: "#FFF3E0", itemPriceColor: "#FFB74D", itemDescColor: "#BCAAA4", itemNameFont: "Georgia" },
  "crimson-flame": { sectionTitleColor: "#FF6B6B", sectionTitleFont: "Impact", sectionBgColor: "rgba(35,8,8,0.9)", sectionBorderColor: "#C62828", itemNameColor: "#FFCDD2", itemPriceColor: "#FF6B6B", itemDescColor: "#EF9A9A", itemNameFont: "Impact" },
  "classic-dark": { sectionTitleColor: "#FF0000", sectionTitleFont: "Impact", sectionBgColor: "rgba(20,20,20,0.9)", sectionBorderColor: "#FF0000", itemNameColor: "#FFFFFF", itemPriceColor: "#FF0000", itemDescColor: "#999999", itemNameFont: "Arial" },
};

interface PriceVariant { label: string; price: string; }

export default function TvDisplay() {
  const [, params] = useRoute("/tv/:token");
  const token = params?.token;
  const [menu, setMenu] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tv/${token}`);
      if (!res.ok) { setError("Display not found"); setLoading(false); return; }
      const data = await res.json();
      setMenu(data.menu); setSlides(data.slides || []); setLoading(false);
    } catch { setError("Failed to load"); setLoading(false); }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const i = setInterval(loadData, 30000); return () => clearInterval(i); }, [loadData]);

  useEffect(() => {
    if (!menu || slides.length <= 1) return;
    const i = setInterval(() => setCurrentSlideIndex(prev => (prev + 1) % slides.length), (menu.slideDuration || 10) * 1000);
    return () => clearInterval(i);
  }, [menu, slides.length]);

  useEffect(() => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (slide.bgMusicUrl) {
      audioRef.current = new Audio(slide.bgMusicUrl);
      audioRef.current.loop = true; audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [currentSlideIndex, slides]);

  if (loading) return <div className="h-screen w-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-red-400" /></div>;
  if (error || !menu) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-2xl">{error || "Not available"}</div>;
  if (slides.length === 0) return <div className="h-screen w-screen bg-black flex items-center justify-center text-gray-500 text-xl">No slides configured</div>;

  const slide = slides[currentSlideIndex];
  if (!slide) return null;
  const tpl = DESIGN_TEMPLATES[slide.templateId || "chunky-red"] || DESIGN_TEMPLATES["chunky-red"];

  const bgStyle: React.CSSProperties = slide.bgType === "gradient" && slide.bgGradient
    ? { background: slide.bgGradient }
    : slide.bgType === "image" && slide.bgImageUrl
    ? { backgroundImage: `url(${slide.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: slide.bgColor || "#0a0a0a" };

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={bgStyle} data-testid="tv-display">
      {slide.bgType === "video" && slide.bgVideoUrl && (
        <video src={slide.bgVideoUrl} autoPlay muted loop className="absolute inset-0 w-full h-full object-cover" />
      )}

      <div className="absolute inset-0 p-4 md:p-6 overflow-hidden" style={{
        display: "grid",
        gridTemplateColumns: `repeat(${slide.layoutColumns || 3}, 1fr)`,
        gap: "12px",
        alignContent: "start",
      }}>
        {(slide.sections || []).map((section: any) => (
          <div key={section.id} className="rounded-xl overflow-hidden h-full" style={{
            backgroundColor: section.bgColor || tpl.sectionBgColor,
            border: `2px solid ${section.borderColor || tpl.sectionBorderColor}`,
          }}>
            <div className="px-4 py-2" style={{
              borderBottom: `2px solid ${section.borderColor || tpl.sectionBorderColor}`,
              background: `linear-gradient(180deg, ${section.borderColor || tpl.sectionBorderColor}22 0%, transparent 100%)`,
            }}>
              <h2 style={{
                fontFamily: section.titleFont || tpl.sectionTitleFont,
                fontSize: "clamp(16px, 2.5vw, 32px)",
                color: section.titleColor || tpl.sectionTitleColor,
                fontWeight: "bold",
                textTransform: "uppercase",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                letterSpacing: "1px",
              }}>{section.title}</h2>
            </div>

            <div className="px-3 py-2">
              {(section.items || []).map((item: any, idx: number) => (
                <div key={item.id} className="flex items-start gap-3 py-1.5" style={{
                  borderBottom: idx < section.items.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover shadow-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold" style={{
                          fontFamily: item.nameFont || tpl.itemNameFont,
                          fontSize: "clamp(11px, 1.5vw, 20px)",
                          color: item.nameColor || tpl.itemNameColor,
                          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        }}>
                          {item.name}
                          {item.isFeatured && <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-400 fill-amber-400 inline ml-1" />}
                        </span>
                        {item.description && (
                          <p className="truncate" style={{
                            color: tpl.itemDescColor || "rgba(255,255,255,0.5)",
                            fontSize: "clamp(8px, 1vw, 13px)",
                          }}>{item.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {item.priceVariants && (item.priceVariants as PriceVariant[]).length > 0 ? (
                          <div className="flex gap-2">
                            {(item.priceVariants as PriceVariant[]).map((v: PriceVariant, vi: number) => (
                              <div key={vi} className="text-center min-w-[40px]">
                                <div style={{ color: item.priceColor || tpl.itemPriceColor, fontSize: "clamp(7px, 0.8vw, 10px)", textTransform: "uppercase", opacity: 0.7, fontWeight: 600 }}>{v.label}</div>
                                <div style={{ color: item.priceColor || tpl.itemPriceColor, fontSize: "clamp(10px, 1.3vw, 18px)", fontWeight: "bold", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{v.price}</div>
                              </div>
                            ))}
                          </div>
                        ) : item.price ? (
                          <span className="font-bold" style={{
                            color: item.priceColor || tpl.itemPriceColor,
                            fontSize: "clamp(12px, 1.8vw, 24px)",
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                          }}>{item.price}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_: any, i: number) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlideIndex ? "bg-white w-8" : "bg-white/20 w-2"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
