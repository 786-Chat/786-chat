import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { Loader2, WifiOff, Volume2, VolumeX } from "lucide-react";

export default function TvCustomerDisplay() {
  const [, params] = useRoute("/tv-customer/:customerId/:tvNum");
  const customerId = params?.customerId;
  const tvNum = params?.tvNum;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inactive, setInactive] = useState(false);

  const loadData = useCallback(async () => {
    if (!customerId || !tvNum) return;
    try {
      const res = await fetch(`/api/tv-customer-display/${customerId}/${tvNum}`);
      if (res.status === 403) {
        setInactive(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Display not found");
        setLoading(false);
        return;
      }
      const d = await res.json();
      setData(d);
      setInactive(false);
      setLoading(false);
    } catch {
      setError("Failed to load display");
      setLoading(false);
    }
  }, [customerId, tvNum]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={48} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 16, color: "#94a3b8" }}>Loading TV Display...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (inactive) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <WifiOff size={64} style={{ color: "#ef4444", marginBottom: 20 }} />
          <h1 style={{ fontSize: "1.8em", marginBottom: 10 }}>Display Inactive</h1>
          <p style={{ color: "#94a3b8" }}>This TV display is currently inactive. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", fontSize: "1.2em" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <TvRenderer data={data} />;
}

function TvRenderer({ data }: { data: any }) {
  const config = data.config || {};
  const tvType = data.tvType;
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (config.music) {
      const audio = new Audio(config.music);
      audio.loop = true;
      audio.volume = 0.5;
      audio.muted = muted;
      audio.play().catch(() => {});
      audioRef.current = audio;
      return () => { audio.pause(); audio.src = ""; };
    }
  }, [config.music]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    try {
      document.documentElement.requestFullscreen?.();
    } catch {}
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000", position: "relative" }}>
      {config.music && (
        <button
          onClick={() => setMuted(!muted)}
          style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
      <TvContent tvType={tvType} config={config} />
    </div>
  );
}

function TvContent({ tvType, config }: { tvType: number; config: any }) {
  const c = config;

  if (tvType === 1) return <Tv1Display c={c} />;
  if (tvType === 4) return <Tv4Display c={c} />;
  if (tvType === 6) return <Tv6Display c={c} />;

  return (
    <div style={{ width: "100%", height: "100%", background: c.bgColor || "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", color: c.textColor || "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3em", fontWeight: 900, marginBottom: 20 }}>TV {tvType} Display</div>
        <div style={{ fontSize: "1.2em", opacity: 0.7 }}>Live display active</div>
      </div>
    </div>
  );
}

function Tv1Display({ c }: { c: any }) {
  const bgColor = c.bgColor || "#FF8C00";
  const mainColor = c.mainTextColor || "#FFFFFF";
  const hlColor = c.highlightColor || "#FFD700";
  const pColor = c.priceColor || "#FFFFFF";
  const images = c.images || [];
  const mainAnim = c.mainTextAnimation || "none";
  const hlAnim = c.highlightAnimation || "none";
  const priceAnim = c.priceAnimation || "none";
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (images.length > 1) {
      const iv = setInterval(() => setImgIdx(p => (p + 1) % images.length), 3000);
      return () => clearInterval(iv);
    }
  }, [images.length]);

  const animStyle = (anim: string): React.CSSProperties => {
    if (!anim || anim === "none") return {};
    return { animation: `tv1_${anim} ${anim === "flash" ? "1.5s" : "2s"} ease-in-out infinite` };
  };

  return (
    <div style={{ width: "100%", height: "100%", background: bgColor, position: "relative", overflow: "hidden" }}>
      {c.logo && <img src={c.logo} alt="" style={{ position: "absolute", top: 20, left: 20, width: 60, height: 60, borderRadius: "50%", objectFit: "cover", zIndex: 5 }} />}

      <div style={{ position: "absolute", top: "7%", left: "5%", right: "35%", textAlign: "center", zIndex: 5 }}>
        {c.headerText && (
          <div style={{ fontSize: "clamp(1.8em, 3.5vw, 3em)", fontWeight: 900, color: mainColor, textTransform: "uppercase", letterSpacing: 3, textShadow: "2px 3px 6px rgba(0,0,0,0.3)", fontFamily: "Arial Black, Impact, sans-serif", ...animStyle(mainAnim) }}>
            {c.headerText}
          </div>
        )}
        <div style={{ fontSize: "clamp(2.5em, 6vw, 5em)", fontWeight: 900, marginTop: 10, fontFamily: "Arial Black, Impact, sans-serif" }}>
          <span style={{ color: mainColor, textShadow: "2px 3px 6px rgba(0,0,0,0.3)", ...animStyle(mainAnim) }}>{c.mainText} </span>
          {c.mainTextHighlight && (
            <span style={{ color: hlColor, fontSize: "110%", display: "inline-block", textShadow: hlAnim === "glow" ? `0 0 10px ${hlColor}, 0 0 20px ${hlColor}` : undefined, ...animStyle(hlAnim) }}>
              {c.mainTextHighlight}
            </span>
          )}
        </div>
      </div>

      {c.priceText && (
        <div style={{ position: "absolute", top: "5%", right: "5%", textAlign: "right", zIndex: 5, ...animStyle(priceAnim), animation: priceAnim === "none" ? "tv1_pricePopIn 0.8s ease-out" : animStyle(priceAnim).animation }}>
          <div style={{ fontSize: "clamp(2.5em, 6vw, 5em)", fontWeight: 900, color: pColor, fontFamily: "Arial Black, Impact, sans-serif", textShadow: priceAnim === "glow" ? `0 0 10px ${pColor}, 0 0 20px ${pColor}, 0 0 40px ${pColor}` : "2px 3px 6px rgba(0,0,0,0.4)", lineHeight: 0.9, transform: "rotate(5deg)" }}>
            <span style={{ fontSize: "55%", verticalAlign: "super" }}>{c.priceText?.charAt(0)}</span>
            {c.priceText?.slice(1, -2)}
            <span style={{ fontSize: "60%", verticalAlign: "super" }}>{c.priceText?.slice(-2)}</span>
          </div>
        </div>
      )}

      {c.sideText && (
        <div style={{ position: "absolute", bottom: "8%", left: "4%", background: "rgba(0,0,0,0.75)", color: "white", padding: "18px 28px", borderRadius: 14, transform: "rotate(-5deg)", maxWidth: 220, textAlign: "center", zIndex: 5, backdropFilter: "blur(5px)", animation: "tv1_sideSlideIn 1s ease-out" }}>
          <div style={{ fontSize: "1.3em", fontWeight: "bold", letterSpacing: 0.5 }}>{c.sideText}</div>
          {c.sideSubText && <div style={{ fontSize: "0.85em", marginTop: 6, opacity: 0.8 }}>{c.sideSubText}</div>}
        </div>
      )}

      {images.length > 0 && (
        <div style={{ position: "absolute", bottom: "3%", right: "3%", zIndex: 5, animation: "tv1_imgFloat 3s ease-in-out infinite" }}>
          {images.map((img: any, i: number) => (
            <img key={i} src={typeof img === "string" ? img : img.src} alt="" style={{ maxHeight: "35vh", maxWidth: "30vw", objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))", display: i === imgIdx ? "block" : "none", transition: "opacity 0.8s ease" }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes tv1_pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes tv1_bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes tv1_glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes tv1_shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes tv1_flash { 0%,50%,100% { opacity: 1; } 25%,75% { opacity: 0.5; } }
        @keyframes tv1_swing { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv1_pricePopIn { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.2) rotate(8deg); } 100% { transform: scale(1) rotate(5deg); opacity: 1; } }
        @keyframes tv1_sideSlideIn { 0% { transform: rotate(-5deg) translateX(-40px); opacity: 0; } 100% { transform: rotate(-5deg) translateX(0); opacity: 1; } }
        @keyframes tv1_imgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>
    </div>
  );
}

function Tv4Display({ c }: { c: any }) {
  return (
    <div style={{ width: "100%", height: "100%", background: c.bgColor || "#1a1a2e", position: "relative", overflow: "hidden" }}>
      {c.bgMedia && (c.bgMediaType === "video" ? <video src={c.bgMedia} autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} /> : <img src={c.bgMedia} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />)}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        {c.logo && <img src={c.logo} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 20 }} />}
        <div style={{ fontSize: "clamp(2em, 5vw, 4em)", fontWeight: 900, color: c.textColor || "#fff", textAlign: "center", marginBottom: 10 }}>{c.titleLine1 || ""}</div>
        <div style={{ fontSize: "clamp(1.5em, 3vw, 2.5em)", fontWeight: 700, color: c.accentColor || "#ff6b35", textAlign: "center", marginBottom: 30 }}>{c.titleLine2 || ""}</div>
        {c.mainImage && <img src={c.mainImage} alt="" style={{ maxHeight: "35vh", maxWidth: "50vw", objectFit: "contain", marginBottom: 20 }} />}
        {c.sizes && c.sizes.length > 0 && (
          <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
            {c.sizes.map((s: any, i: number) => (
              <div key={i} style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 30px" }}>
                <div style={{ fontSize: "1em", color: c.textColor || "#fff", opacity: 0.7 }}>{s.label || ""}</div>
                <div style={{ fontSize: "1.8em", fontWeight: 900, color: c.accentColor || "#ff6b35" }}>{s.price || ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tv6Display({ c }: { c: any }) {
  const items = c.promoItems || [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: `linear-gradient(to bottom, ${c.topColor || "#1a1a2e"} 50%, ${c.bottomColor || "#16213e"} 50%)` }}>
      {c.bgMedia && (c.bgMediaType === "video" ? <video src={c.bgMedia} autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={c.bgMedia} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />)}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
        {items.map((item: any, i: number) => (
          <div key={i} style={{ textAlign: "center", transform: i === Math.floor(items.length / 2) ? "scale(1.1)" : "scale(1)", flex: 1, maxWidth: 300 }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", maxHeight: "40vh", objectFit: "contain", marginBottom: 15 }} />}
            <div style={{ fontSize: "1.3em", fontWeight: "bold", color: c.textColor || "#fff" }}>{item.title || ""}</div>
            <div style={{ fontSize: "1.8em", fontWeight: 900, color: c.accentColor || "#ff6b35" }}>{item.price || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
