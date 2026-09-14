import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Clock, ChevronRight, Utensils, Menu, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRestaurantBySlug } from "@/lib/api";

const defaultHeroImages = [
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427360091-9r3k6.png",
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427361901-8vq08o.png", 
  "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427363381-p9jrbt.png"
];

// Rainbow colors for sparkles
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

export default function ShirinMahalWelcome() {
  const [, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "shirin-mahal-sweet-restaurant";
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sparkleIdRef = useRef(0);
  const magicSoundRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };


  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug),
  });

  const heroVideo = restaurant?.heroVideoUrl || restaurant?.welcomeBackgroundVideoUrl;
  const heroGif = restaurant?.heroGifUrl || restaurant?.welcomeBackgroundGifUrl;
  const backgroundType = restaurant?.welcomeBackgroundType || "slider";
  const restaurantSliderImages = restaurant?.welcomeSliderImages as string[] | undefined;
  const sliderImages: string[] = restaurantSliderImages?.length 
    ? restaurantSliderImages 
    : defaultHeroImages;
  const staticImage = restaurant?.welcomeBackgroundImageUrl;

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

  // Slider timer
  useEffect(() => {
    if (backgroundType === "slider" && !heroVideo && !heroGif) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [backgroundType, heroVideo, heroGif, sliderImages.length]);

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

  const goToMenu = () => {
    setLocation(`/menu/${restaurant?.slug || slug}`);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div 
      className="min-h-screen bg-black overflow-hidden scroll-smooth"
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

      {/* Sticky Navigation Header - Lakers Style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt="Shirin Mahal" className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#ffd700] flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-white font-bold text-xl hidden sm:block">Shirin Mahal</span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("hero")} className="text-red-500 hover:text-red-400 transition-colors font-medium">Home</button>
              <button onClick={goToMenu} className="text-white hover:text-[#d4af37] transition-colors font-medium">Menu</button>
              <button onClick={() => scrollToSection("about")} className="text-white hover:text-[#d4af37] transition-colors font-medium">About</button>
              <button onClick={() => scrollToSection("contact")} className="text-white hover:text-[#d4af37] transition-colors font-medium">Contact</button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pt-4 pb-2 space-y-3"
            >
              <button onClick={() => { scrollToSection("hero"); setMobileMenuOpen(false); }} className="block w-full text-left text-red-500 py-2">Home</button>
              <button onClick={() => { goToMenu(); setMobileMenuOpen(false); }} className="block w-full text-left text-white py-2">Menu</button>
              <button onClick={() => { scrollToSection("about"); setMobileMenuOpen(false); }} className="block w-full text-left text-white py-2">About</button>
              <button onClick={() => { scrollToSection("contact"); setMobileMenuOpen(false); }} className="block w-full text-left text-white py-2">Contact</button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Full-Screen Hero Section with Video - Lakers Style */}
      <section id="hero" className="relative h-screen w-full">
        {/* Video/Image Background - Full Screen */}
        {(backgroundType === "video" || heroVideo) && heroVideo ? (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            
            {/* Lakers-Style Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-center"
              >
                {/* Main Title with Brush Stroke Effect */}
                <div className="relative inline-block mb-4">
                  <motion.h1
                    className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-wider"
                    style={{
                      textShadow: '4px 4px 0px #d4af37, 8px 8px 20px rgba(0,0,0,0.8)',
                      fontFamily: 'Impact, Haettenschweiler, sans-serif',
                      letterSpacing: '0.05em'
                    }}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    SHIRIN MAHAL
                  </motion.h1>
                </div>
                
                {/* Banner/Ribbon Style Tagline */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="relative inline-block"
                >
                  <div 
                    className="px-8 py-3 sm:px-12 sm:py-4"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.9) 10%, rgba(212, 175, 55, 0.9) 90%, transparent 100%)',
                      clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)'
                    }}
                  >
                    <span 
                      className="text-lg sm:text-2xl md:text-3xl font-bold tracking-widest"
                      style={{ 
                        color: '#1a1a2e',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.3)'
                      }}
                    >
                      FINEST INDIAN SWEETS
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Sound Toggle Button - only show when muted so user can unmute */}
            {isMuted && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleSound(); }}
              className="absolute bottom-24 right-6 z-30 p-4 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 transition-all hover:scale-110"
              style={{ cursor: 'pointer' }}
              data-testid="button-toggle-sound"
            >
              <VolumeX className="h-6 w-6 text-white" />
            </button>
            )}
          </div>
        ) : (backgroundType === "gif" || heroGif) && heroGif ? (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroGif})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          </div>
        ) : backgroundType === "image" && staticImage ? (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${staticImage})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${sliderImages[currentSlide]})` }} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Slider Indicators */}
        {backgroundType === "slider" && !heroVideo && !heroGif && sliderImages.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-[#d4af37] w-8' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}

        {/* Scroll Down Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronRight className="h-8 w-8 text-white/60 rotate-90" />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            The <span className="text-[#d4af37]">Finest</span> Sweets
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/70 text-lg max-w-2xl mx-auto mb-12"
          >
            We take pride in crafting the most authentic and delicious Indian sweets, made with traditional recipes and the finest ingredients.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Traditional Recipes", desc: "Passed down through generations" },
              { title: "Fresh Daily", desc: "Made fresh every morning" },
              { title: "Premium Ingredients", desc: "Only the finest quality" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-[#d4af37]/20"
              >
                <h3 className="text-xl font-bold text-[#d4af37] mb-2">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Button 
              onClick={goToMenu}
              size="lg"
              className="bg-[#d4af37] hover:bg-[#ffd700] text-black font-bold px-8 py-6 text-lg rounded-full"
            >
              View Our Menu <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white text-center mb-12"
          >
            Visit <span className="text-[#d4af37]">Us</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-[#d4af37] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold text-lg">Address</h3>
                  <p className="text-white/70">6 Terminus Street, Harlow, Essex CM20 1ES</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-[#d4af37] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold text-lg">Phone</h3>
                  <p className="text-white/70">01270 964156</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-[#d4af37] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold text-lg">Hours</h3>
                  <p className="text-white/70">Mon-Sun: 10:00 AM - 10:00 PM</p>
                </div>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden h-[300px]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2469.8!2d0.0888!3d51.7634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDQ1JzQ4LjIiTiAwwrAwNSczMi4wIkU!5e0!3m2!1sen!2suk!4v1600000000000!5m2!1sen!2suk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#1a1a2e] border-t border-[#d4af37]/20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/50 text-sm">
            © 2024 Shirin Mahal Sweet Restaurant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
