import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, ChevronRight, Utensils, ShoppingBag } from "lucide-react";

const RAINBOW_COLORS = [
  '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3',
  '#ff1493', '#00ffff', '#ff69b4', '#ffd700', '#7fff00'
];

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

export default function DasiFoodHubWelcome() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const sparkleIdRef = useRef(0);
  const magicSoundRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize magic sound
  useEffect(() => {
    magicSoundRef.current = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_14c03cb0f4.mp3');
    magicSoundRef.current.volume = 0.3;
  }, []);


  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Create sparkles on click
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (magicSoundRef.current) {
      magicSoundRef.current.currentTime = 0;
      magicSoundRef.current.play().catch(() => {});
    }

    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < 12; i++) {
      newSparkles.push({
        id: sparkleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        color: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
      });
    }
    setSparkles(prev => [...prev, ...newSparkles]);

    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
    }, 1000);
  }, []);

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants", "dasi-food-hub"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants/slug/dasi-food-hub");
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu-items", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const res = await fetch(`/api/restaurants/${restaurant.id}/menu`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  const { data: heroImages = [] } = useQuery({
    queryKey: ["/api/hero-images", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const res = await fetch(`/api/restaurants/${restaurant.id}/hero-images`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  // Get slider images - use admin-configured welcomeSliderImages first, then hero images, then menu item images
  const restaurantSliderImages = restaurant?.welcomeSliderImages as string[] | undefined;
  const sliderImages = restaurantSliderImages && restaurantSliderImages.length > 0
    ? restaurantSliderImages
    : heroImages.length > 0 
      ? heroImages.map((h: any) => h.imageUrl).filter(Boolean)
      : menuItems.filter((item: any) => item.image).slice(0, 10).map((item: any) => item.image);

  // Background type configuration
  const heroVideo = restaurant?.heroVideoUrl || restaurant?.welcomeBackgroundVideoUrl;
  const heroGif = restaurant?.heroGifUrl || restaurant?.welcomeBackgroundGifUrl;
  const backgroundType = restaurant?.welcomeBackgroundType || "slider";
  const staticImage = restaurant?.welcomeBackgroundImageUrl;

  // Slider auto-advance
  useEffect(() => {
    if (backgroundType === "slider" && !heroVideo && !heroGif && sliderImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [backgroundType, heroVideo, heroGif, sliderImages.length]);

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-gray-950"
      onClick={handleClick}
      style={{ cursor: 'none' }}
    >
      {/* Custom Rainbow Wing Cursor */}
      <div
        className="pointer-events-none fixed z-[9999] transition-transform duration-75"
        style={{
          left: cursorPos.x - 20,
          top: cursorPos.y - 20,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" className="animate-pulse">
          <defs>
            <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="16%" stopColor="#ff7f00" />
              <stop offset="33%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#00ff00" />
              <stop offset="66%" stopColor="#0000ff" />
              <stop offset="83%" stopColor="#4b0082" />
              <stop offset="100%" stopColor="#9400d3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M20 20 C10 10, 5 15, 2 8 C5 12, 8 10, 12 5 C10 12, 12 15, 20 20" fill="url(#rainbowGradient)" filter="url(#glow)" />
          <path d="M20 20 C30 10, 35 15, 38 8 C35 12, 32 10, 28 5 C30 12, 28 15, 20 20" fill="url(#rainbowGradient)" filter="url(#glow)" />
          <circle cx="20" cy="20" r="3" fill="white" filter="url(#glow)" />
        </svg>
      </div>

      {/* Rainbow Sparkles on Click */}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="pointer-events-none fixed z-[9998]"
            initial={{ x: sparkle.x, y: sparkle.y, scale: 0, opacity: 1, rotate: sparkle.rotation }}
            animate={{ 
              x: sparkle.x + (Math.random() - 0.5) * 200,
              y: sparkle.y + (Math.random() - 0.5) * 200,
              scale: 1, opacity: 0, rotate: sparkle.rotation + 360
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <svg width={sparkle.size} height={sparkle.size} viewBox="0 0 24 24">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill={sparkle.color} style={{ filter: `drop-shadow(0 0 6px ${sparkle.color})` }} />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`
        @keyframes rainbow-shift {
          0%, 100% { filter: hue-rotate(0deg); }
          25% { filter: hue-rotate(30deg); }
          50% { filter: hue-rotate(60deg); }
          75% { filter: hue-rotate(30deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.5), 0 0 60px rgba(255, 107, 107, 0.3); }
          50% { box-shadow: 0 0 50px rgba(255, 193, 7, 0.6), 0 0 80px rgba(255, 193, 7, 0.4); }
        }
        
        @keyframes neon-pulse {
          0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor; }
          50% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 80px currentColor; }
        }
        
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-50px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .slider-track {
          display: flex;
          animation: scrollLeft 20s linear infinite;
        }
        
        .slider-track:hover {
          animation-play-state: paused;
        }
        
        .rainbow-text {
          background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        
        .rainbow-border-dark {
          border: 2px solid transparent;
          background: linear-gradient(#1a1a2e, #1a1a2e) padding-box,
                      linear-gradient(135deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3) border-box;
        }
        
        .rainbow-button {
          background: linear-gradient(135deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb);
          background-size: 300% 300%;
          animation: shimmer 4s ease infinite;
        }
        
        .dark-card {
          background: rgba(26, 26, 46, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .dark-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 107, 107, 0.3);
        }
        
        .glow-text {
          animation: neon-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Background based on type */}
      {(backgroundType === "video" || heroVideo) && heroVideo ? (
        <div className="fixed inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gray-950/60" />
        </div>
      ) : (backgroundType === "gif" || heroGif) && heroGif ? (
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroGif})` }} />
          <div className="absolute inset-0 bg-gray-950/50" />
        </div>
      ) : backgroundType === "image" && staticImage ? (
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${staticImage})` }} />
          <div className="absolute inset-0 bg-gray-950/60" />
        </div>
      ) : backgroundType === "slider" && sliderImages.length > 0 ? (
        <div className="fixed inset-0 overflow-hidden">
          {sliderImages.map((img: string, index: number) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="absolute inset-0 bg-gray-950/60" />
        </div>
      ) : (
        <>
          {/* Default: Dark gradient background with rainbow accents */}
          <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950" />
          <div 
            className="fixed inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url('/dasi-rainbow-bg.gif')`,
              mixBlendMode: 'overlay',
            }}
          />
        </>
      )}
      
      {/* Animated rainbow glow spots */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Dark Header with Rainbow Border */}
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl shadow-2xl" style={{borderBottom: '3px solid', borderImage: 'linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3, #5f27cd) 1'}}>
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full rainbow-border-dark flex items-center justify-center overflow-hidden">
                {restaurant?.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name || "Dasi Food Hub"} className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-6 h-6 text-pink-400" />
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold rainbow-text">
                {restaurant?.name || "Dasi Food Hub"}
              </h1>
            </div>
            <Link href="/dasi-food-hub/menu">
              <Button className="rainbow-button text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                View Menu
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section - Dark Theme */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-extrabold rainbow-text mb-6" style={{animation: 'float 4s ease-in-out infinite'}}>
              Welcome to
            </h2>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 drop-shadow-2xl">
              Dasi Food Hub
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 font-medium">
              Experience the vibrant flavors of authentic cuisine
            </p>
          </div>
          
          {/* Order Button - Left aligned with animation */}
          <div className="max-w-5xl mx-auto">
            <div className="flex mb-8">
              <Link href="/dasi-food-hub/menu?type=delivery">
                <Button 
                  className="rainbow-button text-white text-xl font-bold px-10 py-6 rounded-full shadow-xl transition-all duration-300 hover:translate-x-2 hover:shadow-2xl group"
                  style={{animation: 'pulse-glow 2s ease-in-out infinite, slideInLeft 0.6s ease-out'}}
                >
                  <ShoppingBag className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                  Order Delivery
                  <ChevronRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Auto-scrolling Image Slider */}
          {sliderImages.length > 0 && (
            <div className="w-full overflow-hidden mb-16">
              <div className="slider-track">
                {/* First set of images */}
                {sliderImages.map((imageUrl: string, idx: number) => (
                  <div key={`slide-1-${idx}`} className="flex-shrink-0 w-48 h-48 mx-2 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl hover:border-pink-500/50 transition-all">
                    <img src={imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {sliderImages.map((imageUrl: string, idx: number) => (
                  <div key={`slide-2-${idx}`} className="flex-shrink-0 w-48 h-48 mx-2 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl hover:border-pink-500/50 transition-all">
                    <img src={imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Info Cards - Dark Theme */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Location */}
            <div className="dark-card rounded-2xl p-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Location</h3>
              <p className="text-gray-400">{restaurant?.address || "6 Terminus Street, Harlow, Essex CM20 1ES"}</p>
            </div>
            
            {/* Hours */}
            <div className="dark-card rounded-2xl p-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/30">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Opening Hours</h3>
              <p className="text-gray-400">Mon-Sun: 12PM - 11PM</p>
            </div>
            
            {/* Phone */}
            <div className="dark-card rounded-2xl p-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Contact</h3>
              <p className="text-gray-400">{restaurant?.phone || "01270 964156"}</p>
            </div>
          </div>
        </section>

        {/* Map Section - Dark Theme */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center rainbow-text mb-8">Find Us</h2>
            <div className="dark-card rounded-2xl overflow-hidden p-2">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2469.8!2d0.0888!3d51.7634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDQ1JzQ4LjIiTiAwwrAwNSczMi4wIkU!5e0!3m2!1sen!2suk!4v1600000000000!5m2!1sen!2suk"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </section>

        {/* Featured Items - Dark Theme */}
        {menuItems.length > 0 && (
          <section className="container mx-auto px-4 pb-20">
            <h2 className="text-4xl font-bold text-center rainbow-text mb-12">
              Featured Dishes
            </h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {menuItems.slice(0, 4).map((item: any) => (
                <div key={item.id} className="dark-card rounded-2xl overflow-hidden">
                  {item.image && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-2xl font-bold rainbow-text">£{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/dasi-food-hub/menu">
                <Button className="rainbow-button text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:scale-105 transition-transform">
                  View Full Menu <ChevronRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
