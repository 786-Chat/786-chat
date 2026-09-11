import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, User, Sparkles, Star, Volume2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mouseTrails, setMouseTrails] = useState<MouseTrail[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  // Mouse movement handler with colorful trails
  const handleMouseMove = (e: React.MouseEvent) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const newTrail: MouseTrail = {
      x: e.clientX,
      y: e.clientY,
      id: trailIdRef.current++,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 20 + 10
    };
    
    setMouseTrails(prev => [...prev.slice(-20), newTrail]);
    
    // Play magic sound on mouse move
    if (Math.random() > 0.95) { // Occasional sounds
      playMagicSound(Math.random() * 400 + 400, 100);
    }
    
    // Simple background effects only
    
    // Clean up old trails
    setTimeout(() => {
      setMouseTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    playMixSound(); // Play mix sound on submit
    
    try {
      console.log('🔐 Attempting admin login with:', { email: email.trim(), passwordLength: password.trim().length });
      
      // Send login request to server for proper authentication
      const response = await fetch('/api/admin/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });
      
      console.log('📡 Server response status:', response.status);
      const result = await response.json();
      console.log('📋 Server response:', result);
      
      if (result.success) {
        playMagicSound(1200, 500); // Success sound
        
        // Server manages session via cookies, no need for client-side storage
        toast({
          title: "Admin Login Successful ✨",
          description: "Welcome to the admin dashboard",
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
        });
        
        setTimeout(() => {
          setLocation("/admin-dashboard");
        }, 500);
        return;
      }

      // If login failed, show error
      playMagicSound(200, 300); // Error sound
      toast({
        title: "Login Failed",
        description: result.message || "Invalid email or password",
        variant: "destructive",
      });
    } catch (error: any) {
      playMagicSound(200, 300); // Error sound
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Mouse Trail Effects */}
      {mouseTrails.map((trail) => (
        <div
          key={trail.id}
          className="fixed pointer-events-none rounded-full animate-ping z-10"
          style={{
            left: trail.x - trail.size / 2,
            top: trail.y - trail.size / 2,
            width: trail.size,
            height: trail.size,
            backgroundColor: trail.color,
            boxShadow: `0 0 20px ${trail.color}`,
            opacity: 0.7
          }}
        />
      ))}

      {/* Main Content Container - Mobile Responsive */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-4 sm:gap-8 lg:gap-12 max-w-7xl mx-auto w-full">
        
        {/* Simple Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-4">
            Secure access to the administrative dashboard
          </p>
        </div>

        {/* Login Form - Mobile Optimized */}
        <Card className="w-full max-w-sm sm:max-w-md mx-4 bg-slate-800/90 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <CardHeader className="text-center space-y-2 px-4 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Login
              </CardTitle>
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 animate-pulse" />
            </div>
            <CardDescription className="text-slate-300 text-sm sm:text-base">
              Secure access to the administrative dashboard
            </CardDescription>
            
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
          
          <CardContent className="px-4 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="bg-slate-700/50 border-purple-500/30 text-white placeholder-slate-400 focus:border-purple-400 transition-colors text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (Math.random() > 0.8) playMagicSound(600 + Math.random() * 200, 50);
                    }}
                    className="bg-slate-700/50 border-purple-500/30 text-white pr-12 focus:border-purple-400 focus:ring-purple-400/20 h-11"
                    placeholder="Enter your password"
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
                    Enter Admin Dashboard
                    <Star className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Navigation to Branch Login */}
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                onClick={() => {
                  setLocation('/branch-login');
                  playMagicSound(600, 150);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Go to Branch Login
              </Button>
            </div>

            {/* Info Section with Pink Background Content */}
            <div className="mt-8 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-center text-sm">
              <p className="font-medium mb-2">This web app was created by Mujeeb Sardar in 2025.</p>
              <p className="mb-2">He has 11 years of food safety experience and knows how to help you achieve a 5-star rating.</p>
              <p className="flex items-center justify-center gap-2">
                <span>📞</span>
                <span className="font-medium">Toll-Free Phone: 0800 4714 726</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}