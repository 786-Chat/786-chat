import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Sparkles, Star, Volume2, Mail, MessageCircle, HelpCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MouseTrail {
  x: number;
  y: number;
  id: number;
  color: string;
  size: number;
}

const branchCubeImages = [
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087872596-7c3dec17-9044-4dd6-a870-6595396b61ca-logo2-4QPqPg5WqzqAdqmEY7rLQnJdrTTlf7.png",
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087871673-1829269c-78e7-4c76-a6e2-0c1090fd8c2e-logo1-m5BHauMOSuVvkp1yxc1LjRvdzjOuL4.png",
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087872596-7c3dec17-9044-4dd6-a870-6595396b61ca-logo2-4QPqPg5WqzqAdqmEY7rLQnJdrTTlf7.png",
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087871673-1829269c-78e7-4c76-a6e2-0c1090fd8c2e-logo1-m5BHauMOSuVvkp1yxc1LjRvdzjOuL4.png",
] as const;

export default function BranchLogin() {
  const [, setLocation] = useLocation();
  const [branchPin, setBranchPin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mouseTrails, setMouseTrails] = useState<MouseTrail[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [, setBranchLoginVideoUrl] = useState("");
  const { toast } = useToast();
  const trailIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Load the admin-managed Branch Login marketing video
  useEffect(() => {
    fetch('/api/public/branch-login-media')
      .then((res) => res.json())
      .then((data) => setBranchLoginVideoUrl(data?.videoUrl || ''))
      .catch(() => setBranchLoginVideoUrl(''));
  }, []);
  // Magic sound generator
  const playMagicSound = (frequency: number = 800, duration: number = 200) => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioContextRef.current.currentTime + duration / 1000);
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio playback not available');
    }
  };

  // Mix sound for different interactions
  const playMixSound = () => {
    if (!soundEnabled) return;
    const frequencies = [440, 554, 659, 880];
    frequencies.forEach((freq, index) => {
      setTimeout(() => playMagicSound(freq, 150), index * 50);
    });
  };

  // Mouse movement handler with colorful trails and flowing glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const colors = ['#00ff88', '#00ccff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const newTrail: MouseTrail = {
      x: e.clientX,
      y: e.clientY,
      id: trailIdRef.current++,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 30 + 20
    };
    
    setMouseTrails(prev => [...prev.slice(-25), newTrail]);
    
    // Play magic sound on mouse move
    if (Math.random() > 0.96) { // Occasional sounds
      playMagicSound(Math.random() * 400 + 400, 100);
    }
    
    // Clean up old trails
    setTimeout(() => {
      setMouseTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    playMixSound(); // Play mix sound on submit
    
    try {
      // Regular branch login
      const response = await fetch("/api/auth/branch-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branchPin: branchPin.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        playMagicSound(1000, 400); // Success sound
        toast({
          title: "Login Successful ✨",
          description: `Welcome to ${data.branch?.name || "your branch"} dashboard`,
          className: "bg-gradient-to-r from-green-500 to-blue-500 text-white border-0"
        });
        setTimeout(() => {
          setLocation("/branch-dashboard");
        }, 500);
      } else {
        playMagicSound(200, 300); // Error sound
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      playMagicSound(200, 300); // Error sound
      console.error("Login error:", error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-x-hidden overflow-y-auto"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Beautiful Flowing Glow Effects - Like in the image */}
      {mouseTrails.map((trail) => (
        <div
          key={trail.id}
          className="fixed pointer-events-none z-10"
          style={{
            left: trail.x - trail.size / 2,
            top: trail.y - trail.size / 2,
            width: trail.size * 2,
            height: trail.size * 2,
          }}
        >
          {/* Main glow orb */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${trail.color}80 0%, ${trail.color}40 30%, ${trail.color}20 60%, transparent 100%)`,
              filter: 'blur(8px)',
              opacity: 0.8
            }}
          />
          {/* Inner bright core */}
          <div
            className="absolute inset-1/4 rounded-full animate-ping"
            style={{
              background: `radial-gradient(circle, ${trail.color} 0%, ${trail.color}60 50%, transparent 100%)`,
              filter: 'blur(4px)',
              opacity: 0.9
            }}
          />
          {/* Ultra bright center */}
          <div
            className="absolute inset-2/5 rounded-full"
            style={{
              background: trail.color,
              filter: 'blur(2px)',
              opacity: 1,
              boxShadow: `0 0 20px ${trail.color}, 0 0 40px ${trail.color}60`
            }}
          />
        </div>
      ))}

      {/* New isolated 3D cube: branch login only */}
      <style>{`
        .branch-login-cube-stage {
          --cube-size: 112px;
          width: var(--cube-size);
          height: var(--cube-size);
          perspective: 900px;
          position: relative;
          margin: 4px auto 14px;
          filter: drop-shadow(0 0 24px rgba(34,197,94,.55));
        }
        .branch-login-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: branchLoginCubeRotate 12s linear infinite;
        }
        .branch-login-cube-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border: 1px solid rgba(74,222,128,.75);
          border-radius: 10px;
          background: linear-gradient(145deg, rgba(5,46,22,.98), rgba(22,101,52,.95));
          box-shadow: inset 0 0 22px rgba(255,255,255,.08), 0 0 20px rgba(168,85,247,.35);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .branch-login-cube-face img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          background: linear-gradient(145deg,#052e16,#166534);
          padding: 4px;
        }
        .branch-login-cube-front { transform: rotateY(0deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-back { transform: rotateY(180deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-right { transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-left { transform: rotateY(-90deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-top { transform: rotateX(90deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-bottom { transform: rotateX(-90deg) translateZ(calc(var(--cube-size) / 2)); }
        .branch-login-cube-ring {
          position: absolute;
          left: 50%;
          bottom: -35px;
          width: 145%;
          height: 34px;
          transform: translateX(-50%);
          border: 2px solid rgba(59,130,246,.55);
          border-radius: 50%;
          box-shadow: 0 0 18px rgba(59,130,246,.75), 0 0 34px rgba(217,70,239,.45);
          animation: branchLoginCubeRing 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes branchLoginCubeRotate {
          0% { transform: rotateX(-14deg) rotateY(0deg); }
          100% { transform: rotateX(-14deg) rotateY(360deg); }
        }
        @keyframes branchLoginCubeRing {
          0%,100% { opacity: .55; transform: translateX(-50%) scale(.94); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.03); }
        }
        @media (min-width: 640px) { .branch-login-cube-stage { --cube-size: 126px; margin-bottom: 16px; } }
        @media (min-width: 1024px) { .branch-login-cube-stage { --cube-size: 138px; margin-bottom: 18px; } }
        @media (prefers-reduced-motion: reduce) { .branch-login-cube { animation: none; transform: rotateX(-14deg) rotateY(-32deg); } }
      `}</style>

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col items-center justify-start max-w-sm mx-auto w-full min-w-0 gap-2 pt-16 sm:pt-14 pb-5 px-3">
        <div className="branch-login-cube-stage" aria-label="Rotating pest control showcase">
          <div className="branch-login-cube">
            <div className="branch-login-cube-face branch-login-cube-front"><img src={branchCubeImages[0]} alt="Food & Safety logo" /></div>
            <div className="branch-login-cube-face branch-login-cube-right"><img src={branchCubeImages[1]} alt="Food Hygiene Rating" /></div>
            <div className="branch-login-cube-face branch-login-cube-back"><img src={branchCubeImages[2]} alt="Food & Safety logo" /></div>
            <div className="branch-login-cube-face branch-login-cube-left"><img src={branchCubeImages[3]} alt="Food Hygiene Rating" /></div>
            <div className="branch-login-cube-face branch-login-cube-top"><img src={branchCubeImages[0]} alt="Pest device top" /></div>
            <div className="branch-login-cube-face branch-login-cube-bottom"><img src={branchCubeImages[2]} alt="Pest device bottom" /></div>
          </div>
          <div className="branch-login-cube-ring" />
        </div>

        {/* Beautiful Login Form */}
        <Card className="w-full max-w-sm mx-auto bg-slate-800/60 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <CardHeader className="text-center space-y-1 p-3 pb-2">
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Branch Login
              </CardTitle>
              <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
            </div>
            
            {/* Sound Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playMagicSound(soundEnabled ? 300 : 600, 200);
              }}
              className="hidden"
            >
              <Volume2 className={`w-4 h-4 mr-2 ${soundEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Enter your Email
                </label>
                <Input
                  type="email"
                  value={branchPin}
                  onChange={(e) => {
                    setBranchPin(e.target.value);
                    if (Math.random() > 0.8) playMagicSound(600 + Math.random() * 200, 50);
                  }}
                  className="bg-slate-700/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-purple-400/20"
                  placeholder="Enter your email..."
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Enter your Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (Math.random() > 0.8) playMagicSound(700 + Math.random() * 200, 50);
                    }}
                    className="bg-slate-700/50 border-purple-500/30 text-white pr-12 focus:border-purple-400 focus:ring-purple-400/20"
                    placeholder="Enter your password..."
                    required
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => {
                      setShowPassword(!showPassword);
                      playMagicSound(800, 100);
                    }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-purple-500/25"
                disabled={isLoading}
                onClick={() => playMixSound()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Enter Dashboard
                    <Star className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Info Section with Pink Background Content */}
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-center text-xs">
              <p className="font-medium mb-2">This web app was created by Mujeeb Sardar in 2025.</p>
              <p className="mb-2">He has 11 years of food safety experience and knows how to help you achieve a 5-star rating.</p>
              <p className="flex items-center justify-center gap-2">
                <span>📞</span>
                <span className="font-medium">Toll-Free Phone: 0800 4714 726</span>
              </p>
            </div>

            {/* Demo Section - Moved below toll-free number */}
            <div className="mt-3 space-y-2">
              <div className="text-center text-slate-300 text-sm font-medium">
                ✨ Try Interactive Demo
              </div>
              <Button
                type="button"
                onClick={() => setLocation('/branch-demo')}
                variant="outline"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white border-0 hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-medium"
              >
                🏢 Branch Demo
              </Button>
              <div className="text-center text-slate-400 text-xs">
                Learn how to use the system with step-by-step guides
              </div>
            </div>

          </CardContent>
        </Card>
        <div className="branch-login-approved-cat-device w-full max-w-[270px] mx-auto -mt-1 flex justify-center" aria-label="Pest control device and cat">
          <img src="data:image/webp;base64,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" alt="Black pest control device beside a calico cat" className="block w-full h-auto object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* Help Button - Top Right */}
      <button
        onClick={() => setShowSupportPopup(true)}
        className="fixed top-6 right-6 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
        title="Get help about this app"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Support Popup - Inline */}
      {showSupportPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSupportPopup(false)}
          />
          
          {/* Popup Card */}
          <Card className="relative z-50 w-full max-w-md bg-slate-800/95 backdrop-blur-xl border-blue-500/30 shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-blue-500/20">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-xl text-blue-400">How Can We Help?</CardTitle>
              </div>
              <button
                onClick={() => setShowSupportPopup(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">
              {/* About App */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  About This App
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  This is a <span className="font-semibold text-blue-400">Pest Control Management System</span> for food safety branches. Upload documents, photos, reports, and manage your pest control records all in one place.
                </p>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Key Features
                </h3>
                <ul className="text-slate-300 text-sm space-y-1 ml-6 list-disc">
                  <li>Upload documents, photos & reports</li>
                  <li>View monthly pest control records</li>
                  <li>Manage branch logos & documents</li>
                  <li>Secure branch dashboard</li>
                </ul>
              </div>

              {/* Getting Started */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  Getting Started
                </h3>
                <p className="text-slate-300 text-sm">
                  Enter your branch email and password to login. If you don't have credentials, contact us.
                </p>
              </div>

              {/* Contact */}
              <div className="p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/20">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  Need Support?
                </h3>
                <p className="text-slate-300 text-sm mb-3">
                  Click the green WhatsApp button below to chat with us anytime!
                </p>
                <a
                  href="https://wa.me/447427070000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp: +44 7427 070000
                </a>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowSupportPopup(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Got It, Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Floating Button - Bottom Right */}
      <a
        href="https://wa.me/447427070000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-green-600 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
          +44 7427 070000
        </span>
      </a>
    </div>
  );
}