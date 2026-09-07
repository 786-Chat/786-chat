import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { Loader2, WifiOff, Lock, Volume2, VolumeX, Image as ImageIcon } from "lucide-react";

const animKeyframes = `
@keyframes pricePopIn { 0% { transform: rotate(5deg) scale(0); opacity: 0; } 60% { transform: rotate(5deg) scale(1.15); } 100% { transform: rotate(5deg) scale(1); opacity: 1; } }
@keyframes price_pulse { 0%, 100% { transform: rotate(5deg) scale(1); } 50% { transform: rotate(5deg) scale(1.15); } }
@keyframes price_bounce { 0%, 100% { transform: rotate(5deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-8px); } }
@keyframes price_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
@keyframes price_shake { 0%, 100% { transform: rotate(5deg) translateX(0); } 25% { transform: rotate(5deg) translateX(-4px); } 75% { transform: rotate(5deg) translateX(4px); } }
@keyframes price_flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes price_float { 0%, 100% { transform: rotate(5deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-6px); } }
@keyframes price_swing { 0%, 100% { transform: rotate(5deg); } 25% { transform: rotate(10deg); } 75% { transform: rotate(0deg); } }
@keyframes price_zoomPulse { 0%, 100% { transform: rotate(5deg) scale(1); } 50% { transform: rotate(5deg) scale(1.25); } }
@keyframes anim_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes anim_bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes anim_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
@keyframes anim_shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes anim_flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes anim_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes anim_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
@keyframes anim_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
@keyframes anim_slideIn { 0% { transform: translateY(-30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes anim_rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes floatUpDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes sideTextPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes tv_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes tv_bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes tv_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
@keyframes tv_shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes tv_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes tv_flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes tv_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
@keyframes tv_slideIn { 0% { transform: translateY(-30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes tv_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
@keyframes tv_rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes tv_orbitSpin { 0% { transform: rotate(0deg) translateX(10px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(10px) rotate(-360deg); } }
`;

export default function TvLiveDisplay() {
  const [, params] = useRoute("/tv-live/:token");
  const token = params?.token;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inactive, setInactive] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verified, setVerified] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tv-display/${token}`);
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
      if (d.accessPassword && !verified) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }
      setData(d);
      setInactive(false);
      setLoading(false);
    } catch {
      setError("Failed to load display");
      setLoading(false);
    }
  }, [token, verified]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const verifyPassword = async () => {
    try {
      const res = await fetch(`/api/tv-display/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setVerified(true);
        setNeedsPassword(false);
        setLoading(true);
        loadData();
      } else {
        setPasswordError("Incorrect password");
      }
    } catch {
      setPasswordError("Connection error");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center" data-testid="tv-live-loading">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center" data-testid="tv-live-password">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 w-96 border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <Lock className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Protected Display</h2>
          <p className="text-slate-400 text-sm text-center mb-6">Enter the password to view this display</p>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
            onKeyDown={e => e.key === "Enter" && verifyPassword()}
            placeholder="Enter password"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500"
            data-testid="input-tv-password"
          />
          {passwordError && <p className="text-red-400 text-sm mb-3" data-testid="text-password-error">{passwordError}</p>}
          <button
            onClick={verifyPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
            data-testid="btn-verify-password"
          >
            Access Display
          </button>
        </div>
      </div>
    );
  }

  if (inactive) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center" data-testid="tv-live-inactive">
        <WifiOff className="h-20 w-20 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-500">Display Inactive</h2>
        <p className="text-slate-600 mt-2">This display has been temporarily disabled</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center" data-testid="tv-live-error">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400">{error || "Display not available"}</h2>
          <p className="text-slate-500 mt-2">Check your URL or contact the administrator</p>
        </div>
      </div>
    );
  }

  const config = data.config || {};
  const tvType = data.tvType || 1;
  const orientation = data.orientation || "landscape";

  return (
    <div className="h-screen w-screen overflow-hidden bg-black" data-testid="tv-live-display">
      <style dangerouslySetInnerHTML={{ __html: animKeyframes }} />
      <TvRenderer tvType={tvType} config={config} orientation={orientation} />
    </div>
  );
}

function TvRenderer({ tvType, config, orientation }: {
  tvType: number;
  config: any;
  orientation: string;
}) {
  const isPortrait = orientation === "portrait";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [rotationStep, setRotationStep] = useState(0);

  useEffect(() => {
    if (!config.images || config.images.length <= 1) return;
    const interval = setInterval(() => setRotationStep(s => s + 1), 4000);
    return () => clearInterval(interval);
  }, [config.images]);

  useEffect(() => {
    if (!config.music) return;
    const audio = new Audio(config.music);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    const tryPlay = () => {
      audio.play().then(() => { setMusicPlaying(true); setUserInteracted(true); }).catch(() => setMusicPlaying(false));
    };
    tryPlay();
    const handleInteraction = () => { if (!userInteracted) tryPlay(); };
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    return () => {
      audio.pause(); audio.src = ""; audioRef.current = null;
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [config.music]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false); }
    else { audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {}); }
  };

  const animStyle = (anim: string): React.CSSProperties => {
    if (!anim || anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv_pulse 2s ease-in-out infinite",
      bounce: "tv_bounce 1.5s ease-in-out infinite",
      glow: "tv_glow 2s ease-in-out infinite",
      shake: "tv_shake 1.5s ease-in-out infinite",
      float: "tv_float 3s ease-in-out infinite",
      rotate: "tv_rotate 8s linear infinite",
      rotateSlow: "tv_rotate 15s linear infinite",
      rotateFast: "tv_rotate 4s linear infinite",
      swing: "tv_swing 2s ease-in-out infinite",
      flash: "tv_flash 1.5s ease-in-out infinite",
      slideIn: "tv_slideIn 1s ease-out forwards",
      zoomPulse: "tv_zoomPulse 3s ease-in-out infinite",
      orbitSpin: "tv_orbitSpin 6s linear infinite",
    };
    return { animation: map[anim] || "" };
  };

  if (tvType === 1) return <Tv1Live config={config} isPortrait={isPortrait} rotationStep={rotationStep} />;
  if (tvType === 2) return <Tv2Live config={config} isPortrait={isPortrait} animStyle={animStyle} />;

  const bgStyle: React.CSSProperties = {};
  if (config.bgColor) bgStyle.backgroundColor = config.bgColor;
  if (config.topColor) bgStyle.backgroundColor = config.topColor;
  if (config.bgMedia && config.bgMediaType === "image") {
    bgStyle.backgroundImage = `url(${config.bgMedia})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  return (
    <div className="h-full w-full relative overflow-hidden" style={bgStyle}>
      {config.bgMedia && config.bgMediaType === "video" && (
        <video src={config.bgMedia} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
      )}
      <div className="relative z-10 w-full h-full flex flex-col">
        {config.logo && (
          <div className="absolute top-4 left-4 z-20">
            <img src={config.logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            {config.featuredTitle && <h1 className="text-5xl font-black mb-4" style={{ color: config.textColor || "#fff" }}>{config.featuredTitle}</h1>}
            {config.titleLine1 && <h1 className="text-6xl font-black mb-2" style={{ color: config.textColor || "#fff", ...animStyle(config.titleAnim) }}>{config.titleLine1}</h1>}
            {config.titleLine2 && <h2 className="text-4xl font-bold" style={{ color: config.accentColor || "#ff6b35", ...animStyle(config.titleAnim) }}>{config.titleLine2}</h2>}
            {config.section1Title && <h2 className="text-4xl font-black" style={{ color: config.textColor || "#fff" }}>{config.section1Title}</h2>}
            {config.menuItems && Array.isArray(config.menuItems) && config.menuItems.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                {config.menuItems.map((item: any, i: number) => (
                  <div key={i} className="bg-black/40 backdrop-blur rounded-xl p-4 text-left" style={animStyle(item.animation)}>
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-2" />}
                    <h3 className="text-lg font-bold" style={{ color: config.textColor || "#fff" }}>{item.name}</h3>
                    {item.description && <p className="text-sm opacity-70" style={{ color: config.textColor || "#fff" }}>{item.description}</p>}
                    <p className="text-xl font-bold mt-1" style={{ color: config.priceColor || config.accentColor || "#FFD700" }}>{item.price}</p>
                  </div>
                ))}
              </div>
            )}
            {config.promoItems && Array.isArray(config.promoItems) && config.promoItems.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6 max-w-5xl mx-auto">
                {config.promoItems.map((item: any, i: number) => (
                  <div key={i} className="bg-black/30 backdrop-blur rounded-2xl p-6 text-center" style={animStyle(item.animation)}>
                    {item.image && <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-xl mb-3" />}
                    <h3 className="text-2xl font-black" style={{ color: config.textColor || "#fff" }}>{item.title}</h3>
                    <p className="text-3xl font-bold mt-2" style={{ color: config.accentColor || "#ff6b35" }}>{item.price}</p>
                  </div>
                ))}
              </div>
            )}
            {config.leftItems && Array.isArray(config.leftItems) && (
              <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto mt-8">
                <div className="space-y-3">
                  {config.leftItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-black/30 rounded-xl p-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />}
                      <div className="flex-1 text-left">
                        <h3 className="font-bold" style={{ color: config.textColor || "#fff" }}>{item.name}</h3>
                        <p className="font-bold" style={{ color: config.priceColor || "#ff6b35" }}>{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {config.rightItems && (
                  <div className="space-y-3">
                    {config.rightItems.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 bg-black/30 rounded-xl p-3">
                        {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />}
                        <div className="flex-1 text-left">
                          <h3 className="font-bold" style={{ color: config.textColor || "#fff" }}>{item.name}</h3>
                          <p className="font-bold" style={{ color: config.priceColor || "#ff6b35" }}>{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {config.gridItems && Array.isArray(config.gridItems) && (
              <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto mt-8">
                {config.gridItems.map((item: any, i: number) => (
                  <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: config.gridBgColor || "#1a1a1a", border: `1px solid ${config.borderColor || "#333"}` }}>
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" />}
                    <h3 className="font-bold" style={{ color: config.textColor || "#fff" }}>{item.name}</h3>
                    <p className="font-bold mt-1" style={{ color: config.priceColor || "#ff6b35" }}>{item.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {config.music && (
        <button onClick={toggleMusic} className="fixed bottom-4 right-4 z-50 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 text-white p-3 rounded-full transition-all shadow-lg" data-testid="btn-toggle-music" title={musicPlaying ? "Mute" : "Play"}>
          {musicPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}
      {config.music && !userInteracted && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 cursor-pointer" onClick={() => {
          if (audioRef.current) audioRef.current.play().then(() => { setMusicPlaying(true); setUserInteracted(true); }).catch(() => setUserInteracted(true));
          else setUserInteracted(true);
        }} data-testid="overlay-tap-to-play">
          <div className="text-center animate-pulse">
            <Volume2 className="h-16 w-16 text-white mx-auto mb-4" />
            <p className="text-white text-2xl font-bold">Tap to Start Display</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Tv1Live({ config, isPortrait, rotationStep }: { config: any; isPortrait: boolean; rotationStep: number }) {
  const c = config;
  const bgColor = c.bgColor || "#FF8C00";
  const priceColor = c.priceColor || "#FFFFFF";
  const highlightColor = c.highlightColor || "#FFD700";
  const mainTextColor = c.mainTextColor || "#FFFFFF";
  const images = c.images || [];

  if (isPortrait) {
    return (
      <div className="h-full w-full relative overflow-hidden" style={{ background: bgColor }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}ee 50%, rgba(139,90,43,0.9) 100%)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-[15%]" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(120,80,30,0.6) 30%, rgba(100,65,20,0.9) 100%)", borderTop: "1px solid rgba(160,120,60,0.3)" }} />
        {c.logo && (<div className="absolute top-[1%] left-[4%] z-20" style={{ width: "12%", aspectRatio: "1" }}><div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 shadow-xl"><img src={c.logo} alt="Logo" className="w-full h-full object-cover" /></div></div>)}
        {c.headerText && (<div className="absolute top-[1.5%] left-0 right-0 text-center z-10"><h2 className="font-black tracking-[0.15em] uppercase" style={{ fontSize: "clamp(12px, 3vw, 28px)", color: "#4a1a00", textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: "'Arial Black', 'Impact', sans-serif", letterSpacing: "0.15em" }}>{c.headerText}</h2></div>)}
        {c.priceText && (<div className="absolute right-[5%] top-[1%] z-10 text-right"><div className="font-black" style={{ fontSize: "clamp(24px, 7vw, 56px)", color: priceColor, fontFamily: "'Arial Black', 'Impact', sans-serif", textShadow: c.priceAnimation === "glow" ? `0 0 10px ${priceColor}, 0 0 20px ${priceColor}, 0 0 40px ${priceColor}` : "2px 3px 6px rgba(0,0,0,0.4)", lineHeight: 0.9, transform: "rotate(5deg)", animation: c.priceAnimation === "none" || !c.priceAnimation ? "pricePopIn 0.8s ease-out" : `price_${c.priceAnimation} ${c.priceAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` }}><span style={{ fontSize: "55%", verticalAlign: "super" }}>{c.priceText.charAt(0)}</span>{c.priceText.slice(1, -2)}<span style={{ fontSize: "60%", verticalAlign: "super" }}>{c.priceText.slice(-2)}</span></div></div>)}
        {(c.mainText || c.mainTextHighlight) && (<div className="absolute top-[7%] left-[5%] right-[5%] text-center z-10" style={{ animation: c.mainTextAnimation && c.mainTextAnimation !== "none" ? `anim_${c.mainTextAnimation} 2s ease-in-out infinite` : undefined }}><h1 className="font-black" style={{ fontSize: "clamp(24px, 7vw, 60px)", color: mainTextColor, textShadow: c.mainTextAnimation === "glow" ? `0 0 10px ${mainTextColor}, 0 0 20px ${mainTextColor}` : "2px 3px 6px rgba(0,0,0,0.3)", fontFamily: "'Arial Black', 'Impact', sans-serif", lineHeight: 1.15 }}>{c.mainText}{c.mainTextHighlight ? " " : ""}{c.mainTextHighlight && (<span style={{ color: highlightColor, fontSize: "110%", display: "inline-block", textShadow: c.highlightAnimation === "glow" ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}` : undefined, animation: c.highlightAnimation && c.highlightAnimation !== "none" ? `anim_${c.highlightAnimation} ${c.highlightAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` : undefined }}>{c.mainTextHighlight}</span>)}</h1></div>)}
        {c.sideText && (<div className="absolute left-[3%] top-[30%] z-10 text-center" style={{ animation: "sideTextPulse 2s ease-in-out infinite" }}><div className="relative"><div className="absolute -inset-2" style={{ background: "rgba(180,30,30,0.75)", transform: "rotate(-12deg)", borderRadius: "6px" }} /><div className="relative px-4 py-2" style={{ transform: "rotate(-12deg)" }}>{c.sideText.split("\n").map((line: string, i: number) => (<div key={i} className="font-black" style={{ fontSize: i === 0 ? "clamp(12px, 3vw, 24px)" : "clamp(16px, 4vw, 32px)", color: "#FFFFFF", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "1px 2px 3px rgba(0,0,0,0.4)" }}>{line}</div>))}{c.sideSubText && (<div className="font-bold mt-1" style={{ fontSize: "clamp(8px, 1.8vw, 14px)", color: "#FFE4B5", fontFamily: "'Georgia', serif" }}>{c.sideSubText}</div>)}</div></div></div>)}
        <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-10 flex items-end justify-center" style={{ width: "92%", height: "55%" }}>
          {renderImages(images, rotationStep, true)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ background: bgColor }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}ee 60%, rgba(139,90,43,0.9) 100%)` }} />
      <div className="absolute bottom-0 left-0 right-0 h-[18%]" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(120,80,30,0.6) 30%, rgba(100,65,20,0.9) 100%)", borderTop: "1px solid rgba(160,120,60,0.3)" }} />
      {c.logo && (<div className="absolute top-[4%] left-[3%] z-20" style={{ width: "8%", aspectRatio: "1" }}><div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 shadow-xl"><img src={c.logo} alt="Logo" className="w-full h-full object-cover" /></div></div>)}
      {c.headerText && (<div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-center z-10"><h2 className="font-black tracking-[0.15em] uppercase" style={{ fontSize: "clamp(12px, 2.5vw, 28px)", color: "#4a1a00", textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: "'Arial Black', 'Impact', sans-serif", letterSpacing: "0.2em" }}>{c.headerText}</h2></div>)}
      {(c.mainText || c.mainTextHighlight) && (<div className="absolute top-[16%] left-1/2 -translate-x-1/2 text-center z-10 whitespace-nowrap" style={{ animation: c.mainTextAnimation && c.mainTextAnimation !== "none" ? `anim_${c.mainTextAnimation} 2s ease-in-out infinite` : undefined }}><h1 className="font-black" style={{ fontSize: "clamp(24px, 5vw, 64px)", color: mainTextColor, textShadow: c.mainTextAnimation === "glow" ? `0 0 10px ${mainTextColor}, 0 0 20px ${mainTextColor}` : "2px 3px 6px rgba(0,0,0,0.3)", fontFamily: "'Arial Black', 'Impact', sans-serif", lineHeight: 1.1 }}>{c.mainText}{c.mainTextHighlight ? " " : ""}{c.mainTextHighlight && (<span style={{ color: highlightColor, fontSize: "110%", display: "inline-block", textShadow: c.highlightAnimation === "glow" ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}` : undefined, animation: c.highlightAnimation && c.highlightAnimation !== "none" ? `anim_${c.highlightAnimation} ${c.highlightAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` : undefined }}>{c.mainTextHighlight}</span>)}</h1></div>)}
      {c.sideText && (<div className="absolute left-[2%] top-[40%] z-10 text-center" style={{ animation: "sideTextPulse 2s ease-in-out infinite" }}><div className="relative"><div className="absolute -inset-2" style={{ background: "rgba(180,30,30,0.75)", transform: "rotate(-12deg)", borderRadius: "6px" }} /><div className="relative px-3 py-1" style={{ transform: "rotate(-12deg)" }}>{c.sideText.split("\n").map((line: string, i: number) => (<div key={i} className="font-black" style={{ fontSize: i === 0 ? "clamp(10px, 1.8vw, 22px)" : "clamp(14px, 2.5vw, 30px)", color: "#FFFFFF", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "1px 2px 3px rgba(0,0,0,0.4)" }}>{line}</div>))}{c.sideSubText && (<div className="font-bold mt-1" style={{ fontSize: "clamp(8px, 1vw, 14px)", color: "#FFE4B5", fontFamily: "'Georgia', serif" }}>{c.sideSubText}</div>)}</div></div></div>)}
      {c.priceText && (<div className="absolute right-[3%] top-[5%] z-10 text-right"><div className="font-black" style={{ fontSize: "clamp(28px, 5vw, 64px)", color: priceColor, fontFamily: "'Arial Black', 'Impact', sans-serif", textShadow: c.priceAnimation === "glow" ? `0 0 10px ${priceColor}, 0 0 20px ${priceColor}, 0 0 40px ${priceColor}` : "2px 3px 6px rgba(0,0,0,0.4)", lineHeight: 0.9, transform: "rotate(5deg)", animation: c.priceAnimation === "none" || !c.priceAnimation ? "pricePopIn 0.8s ease-out" : `price_${c.priceAnimation} ${c.priceAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` }}><span style={{ fontSize: "55%", verticalAlign: "super" }}>{c.priceText.charAt(0)}</span>{c.priceText.slice(1, -2)}<span style={{ fontSize: "60%", verticalAlign: "super" }}>{c.priceText.slice(-2)}</span></div></div>)}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-10 flex items-end justify-center" style={{ width: "80%", height: "55%" }}>
        {renderImages(images, rotationStep, false)}
      </div>
    </div>
  );
}

function renderImages(images: any[], rotationStep: number, isPortrait: boolean) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img src={images[0].src || images[0]} alt="" className={`max-h-full object-contain ${isPortrait ? "max-w-[75%]" : "max-w-[50%]"}`} style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))", animation: "floatUpDown 3s ease-in-out infinite" }} />
    );
  }

  const count = Math.min(images.length, 3);
  const slots3P = [{ x: "2%", scale: 0.85, z: 1 }, { x: "28%", scale: 1.2, z: 3 }, { x: "58%", scale: 0.85, z: 1 }];
  const slots2P = [{ x: "8%", scale: 0.95, z: 1 }, { x: "42%", scale: 1.15, z: 3 }];
  const slots3L = [{ x: "5%", scale: 0.8, z: 1 }, { x: "35%", scale: 1.15, z: 3 }, { x: "65%", scale: 0.8, z: 1 }];
  const slots2L = [{ x: "15%", scale: 0.9, z: 1 }, { x: "55%", scale: 1.1, z: 3 }];
  const slots = isPortrait ? (count === 2 ? slots2P : slots3P) : (count === 2 ? slots2L : slots3L);

  return (
    <div className="relative h-full w-full">
      {images.slice(0, count).map((img: any, i: number) => {
        const pos = (i + rotationStep) % count;
        const slot = slots[pos];
        const isFront = slot.z === 3;
        return (
          <img key={i} src={img.src || img} alt="" className="absolute object-contain" style={{
            left: slot.x,
            bottom: isFront ? (isPortrait ? "3%" : "5%") : "0%",
            maxHeight: isFront ? (isPortrait ? "88%" : "90%") : (isPortrait ? "68%" : "70%"),
            maxWidth: isFront ? (isPortrait ? "48%" : "35%") : (isPortrait ? "38%" : "28%"),
            filter: `drop-shadow(0 ${isFront ? 12 : 5}px ${isFront ? 25 : 10}px rgba(0,0,0,${isFront ? 0.7 : 0.35}))`,
            zIndex: slot.z,
            transform: `scale(${slot.scale})`,
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        );
      })}
    </div>
  );
}

function Tv2Live({ config, isPortrait, animStyle }: { config: any; isPortrait: boolean; animStyle: (a: string) => React.CSSProperties }) {
  const c = config;
  const bgColor = c.bgColor || "#1a1a1a";
  const accentColor = c.accentColor || "#DAA520";
  const textColor = c.textColor || "#FFFFFF";

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ background: bgColor }}>
      <div className="absolute inset-0 flex">
        <div className="w-[45%] h-full flex flex-col justify-center p-[3%]">
          {c.logo && (<div className="mb-4"><img src={c.logo} alt="Logo" className="w-16 h-16 object-contain" /></div>)}
          {c.featuredSubtitle && (<div className="mb-2" style={animStyle(c.featuredAnimation)}><p className="text-lg font-bold uppercase tracking-wider" style={{ color: accentColor }}>{c.featuredSubtitle.split("\n").map((l: string, i: number) => <span key={i}>{l}<br /></span>)}</p></div>)}
          {c.featuredTitle && (<h1 className="text-4xl font-black mb-4 leading-tight" style={{ color: textColor, ...animStyle(c.featuredAnimation) }}>{c.featuredTitle.split("\n").map((l: string, i: number) => <span key={i}>{l}<br /></span>)}</h1>)}
          {c.featuredDesc && (<p className="text-sm opacity-70 mb-4" style={{ color: textColor }}>{c.featuredDesc}</p>)}
          {c.featuredPrice && (<div className="inline-block px-6 py-2 rounded-full font-black text-2xl" style={{ background: accentColor, color: bgColor, ...animStyle(c.priceAnimation) }}>{c.featuredPrice}</div>)}
        </div>
        <div className="w-[55%] h-full relative flex items-center justify-center">
          {c.featuredImage && (<img src={c.featuredImage} alt="" className="max-h-[80%] max-w-[90%] object-contain" style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))", ...animStyle(c.imageAnimation) }} />)}
        </div>
      </div>
      {c.comboText && (
        <div className="absolute bottom-[12%] left-0 right-0 text-center z-10 px-8" style={animStyle(c.comboAnimation)}>
          <p className="text-lg font-bold" style={{ color: accentColor }}>{c.comboText}</p>
          {c.comboPrice && <p className="text-xl font-black" style={{ color: textColor }}>{c.comboPrice}</p>}
        </div>
      )}
      {c.menuItems && Array.isArray(c.menuItems) && c.menuItems.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-4 z-10">
          <div className="flex gap-4 overflow-x-auto">
            {c.menuItems.map((item: any, i: number) => (
              <div key={i} className="flex-shrink-0 text-center" style={animStyle(item.animation)}>
                {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg mx-auto mb-1" />}
                <p className="text-xs font-bold" style={{ color: textColor }}>{item.name}</p>
                <p className="text-xs font-bold" style={{ color: accentColor }}>{item.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
