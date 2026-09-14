import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User, Sparkles, Star, Volume2, Mail, MessageCircle, HelpCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo1 from 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087871673-1829269c-78e7-4c76-a6e2-0c1090fd8c2e-logo1-m5BHauMOSuVvkp1yxc1LjRvdzjOuL4.png';
import logo2 from 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087872596-7c3dec17-9044-4dd6-a870-6595396b61ca-logo2-4QPqPg5WqzqAdqmEY7rLQnJdrTTlf7.png';
import logo3 from 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087873423-05924ff1-ac2f-4d93-b68c-224bd139a7d8-logo3-CxaNcaWzudsiU7GosFusQ7OJlxlKx4.png';
import logo4 from 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087874448-db35fc63-5281-4768-abcc-5bec4afb1c06-logo4-OtkAHniroCMOYCjhvbIKDaY0dXtEEe.png';

interface MouseTrail {
  x: number;
  y: number;
  id: number;
  color: string;
  size: number;
}

export default function BranchLogin() {
  const [, setLocation] = useLocation();
  const [branchPin, setBranchPin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mouseTrails, setMouseTrails] = useState<MouseTrail[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const { toast } = useToast();
  const trailIdRef = useRef(0);
  const cubeRef = useRef<HTMLDivElement>(null);
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

  // Handle window resize for responsive cube
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      // Check for admin master credentials first
      if (branchPin.trim() === "mujeeb@job4u.com" && password.trim() === "smrptt77") {
        playMagicSound(1200, 500); // Success sound
        toast({
          title: "Admin Login Successful ✨",
          description: "Welcome to the admin dashboard",
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
        });
        setTimeout(() => {
          setLocation("/admin");
        }, 500);
        return;
      }

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

  const cubeImages = [logo1, logo2, logo3, logo4, logo1, logo2, logo3, logo4, logo1];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
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

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-7xl mx-auto">
        
        {/* 3D Cube with Your Logos - Responsive Mobile/Desktop */}
        <div className="relative">
          <div 
            ref={cubeRef}
            className="cube-container transition-transform duration-300 ease-out"
            style={{ 
              perspective: windowWidth < 768 ? '800px' : '1200px',
              perspectiveOrigin: 'center center',
              transformStyle: 'preserve-3d',
              width: 'fit-content',
              height: 'fit-content',
              margin: '0 auto'
            }}
          >
            <div 
              className="cube relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48" 
              style={{ 
                transformStyle: 'preserve-3d', 
                animation: 'cubeRotate 8s linear infinite',
                margin: windowWidth < 768 ? '60px auto' : '80px auto' // Responsive margin
              }}
            >
              {/* Cube faces with your logos */}
              <div className="cube-face front absolute w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[0]} alt="Food Safety Logo" className="w-20 h-16 md:w-24 md:h-20 lg:w-28 lg:h-22 object-contain filter drop-shadow-lg" />
              </div>
              <div className="cube-face back absolute w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[1]} alt="Food Safety Logo" className="w-18 h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 object-contain filter drop-shadow-lg" />
              </div>
              <div className="cube-face right absolute w-full h-full bg-gradient-to-br from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[2]} alt="Food Safety Logo" className="w-20 h-16 md:w-24 md:h-20 lg:w-28 lg:h-22 object-contain filter drop-shadow-lg" />
              </div>
              <div className="cube-face left absolute w-full h-full bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[3]} alt="Food Safety Logo" className="w-18 h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 object-contain filter drop-shadow-lg" />
              </div>
              <div className="cube-face top absolute w-full h-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[4]} alt="Food Safety Logo" className="w-20 h-16 md:w-24 md:h-20 lg:w-28 lg:h-22 object-contain filter drop-shadow-lg" />
              </div>
              <div className="cube-face bottom absolute w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-center">
                <img src={cubeImages[5]} alt="Food Safety Logo" className="w-18 h-18 md:w-22 md:h-22 lg:w-24 lg:h-24 object-contain filter drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          {/* Floating Elements Around Cube - Responsive */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce opacity-60"
              style={{
                left: `${Math.cos(i * Math.PI / 4) * 50 + 60}px`,
                top: `${Math.sin(i * Math.PI / 4) * 50 + 60}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>

        {/* Beautiful Login Form */}
        <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pest Control Services
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
              className="self-center text-purple-400 hover:text-purple-300"
            >
              <Volume2 className={`w-4 h-4 mr-2 ${soundEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-center text-sm">
              <p className="font-medium mb-2">This web app was created by Mujeeb Sardar in 2025.</p>
              <p className="mb-2">He has 11 years of food safety experience and knows how to help you achieve a 5-star rating.</p>
              <p className="flex items-center justify-center gap-2">
                <span>📞</span>
                <span className="font-medium">Toll-Free Phone: 0800 4714 726</span>
              </p>
            </div>

            {/* Demo Section - Moved below toll-free number */}
            <div className="mt-6 space-y-3">
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
                  Chat on WhatsApp: +44 742 707 0000
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
          +44 742 707 0000
        </span>
      </a>
    </div>
  );
}