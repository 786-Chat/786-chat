import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import useSound from "use-sound";
import { 
  Building2, MapPin, Phone, Mail, ChevronRight, ChevronLeft, 
  Home, Key, FileText, Users, Award, Shield, Star, Search,
  Bed, Bath, Square, Heart, Play, ArrowRight, CheckCircle,
  Building, Landmark, TrendingUp, Clock, Globe, Sparkles,
  Facebook, Instagram, Youtube, Twitter, Menu, X, Rocket, Moon,
  PlayCircle, Tv, Video, Camera, Eye, DollarSign, Calendar, CreditCard, Wallet, Volume2, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PropertyBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  commissionRate: string;
  visitCharges: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  videoUrl?: string | null;
  whatsappNumber?: string | null;
  ownerName?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  contactBgImages?: string[];
  advantages?: { title: string; description: string; icon: string }[];
  featuredProperties?: {
    id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    beds: number;
    baths: number;
    area: string;
    image: string;
    videoUrl?: string;
    soldOut?: boolean;
  }[];
  announcementText?: string | null;
  announcementEnabled?: boolean;
  welcomeVoiceUrl?: string | null;
  welcomeVoiceEnabled?: boolean;
  heroTagline?: string | null;
  heroTitle1?: string | null;
  heroTitle2?: string | null;
  heroTitle3?: string | null;
  heroDescription?: string | null;
  servicesTagline?: string | null;
  servicesTitle?: string | null;
  servicesDescription?: string | null;
  serviceCards?: { title: string; description: string; icon: string; color: string }[];
  introEnabled?: boolean;
  introSoundEnabled?: boolean;
  clickSoundEnabled?: boolean;
  hoverSoundEnabled?: boolean;
  introText?: string | null;
  visitFee?: number;
  mapEmbedUrl?: string | null;
  // Payment methods from database
  jazzCashEnabled?: boolean;
  jazzCashNumber?: string | null;
  easyPaisaEnabled?: boolean;
  easyPaisaNumber?: string | null;
  hblBankEnabled?: boolean;
  hblAccountNumber?: string | null;
  hblAccountTitle?: string | null;
  cashOnDeliveryEnabled?: boolean;
  currency?: string;
  // PWA App Icon Settings
  appIconUrl?: string | null;
  appName?: string | null;
  appShortName?: string | null;
  appThemeColor?: string | null;
  appBackgroundColor?: string | null;
}

const featuredProperties = [
  {
    id: 1,
    title: "Luxury Villa in DHA",
    location: "DHA Phase 6, Lahore",
    price: "Rs. 5.5 Crore",
    type: "Sale",
    beds: 5,
    baths: 6,
    area: "1 Kanal",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format",
    borderColor: "border-cyan-500",
    glowColor: "shadow-cyan-500/50",
  },
  {
    id: 2,
    title: "Modern Apartment",
    location: "Gulberg III, Lahore",
    price: "Rs. 85,000/month",
    type: "Rent",
    beds: 3,
    baths: 3,
    area: "2000 sqft",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format",
    borderColor: "border-emerald-500",
    glowColor: "shadow-emerald-500/50",
  },
  {
    id: 3,
    title: "Commercial Plaza",
    location: "Main Boulevard, Lahore",
    price: "Rs. 12 Crore",
    type: "Sale",
    beds: 0,
    baths: 8,
    area: "8 Marla",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format",
    borderColor: "border-purple-500",
    glowColor: "shadow-purple-500/50",
  },
  {
    id: 4,
    title: "Penthouse Suite",
    location: "Bahria Town, Lahore",
    price: "Rs. 3.2 Crore",
    type: "Sale",
    beds: 4,
    baths: 5,
    area: "4500 sqft",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format",
    borderColor: "border-amber-500",
    glowColor: "shadow-amber-500/50",
  },
];

const services = [
  {
    icon: Home,
    title: "Buy Property",
    description: "Find your dream home from our extensive collection of residential and commercial properties.",
    borderColor: "border-cyan-500",
    iconBg: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-500/10",
  },
  {
    icon: Key,
    title: "Rent Property",
    description: "Discover premium rental properties with flexible terms and transparent pricing.",
    borderColor: "border-emerald-500",
    iconBg: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "Sell Property",
    description: "Get the best value for your property with our expert valuation and marketing.",
    borderColor: "border-purple-500",
    iconBg: "bg-purple-500",
    hoverBg: "hover:bg-purple-500/10",
  },
];

const stats = [
  { value: "500+", label: "Properties Listed", icon: Building, color: "text-cyan-400" },
  { value: "250+", label: "Happy Clients", icon: Users, color: "text-emerald-400" },
  { value: "15+", label: "Years Experience", icon: Award, color: "text-purple-400" },
  { value: "100%", label: "Client Satisfaction", icon: Star, color: "text-amber-400" },
];

const testimonials = [
  {
    name: "Ahmed Khan",
    role: "Property Buyer",
    content: "Excellent service! They helped me find my dream home in DHA. Professional team made the process smooth.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format",
    rating: 5,
    borderColor: "border-cyan-500/50",
  },
  {
    name: "Fatima Ali",
    role: "Property Seller",
    content: "Outstanding experience! They sold my property within 2 weeks at a great price. Highly recommend!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format",
    rating: 5,
    borderColor: "border-emerald-500/50",
  },
  {
    name: "Hassan Malik",
    role: "Commercial Client",
    content: "Best real estate agency! Their knowledge of commercial properties is unmatched. Professional service.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format",
    rating: 5,
    borderColor: "border-purple-500/50",
  },
];

const defaultAdvantages = [
  { title: "Verified Properties", description: "All listings are thoroughly verified", icon: "shield" },
  { title: "Legal Assistance", description: "Complete documentation support", icon: "file" },
  { title: "24/7 Support", description: "Round the clock customer support", icon: "clock" },
  { title: "Wide Network", description: "Extensive network across Pakistan", icon: "globe" },
];

const iconMap: Record<string, React.ComponentType<any>> = {
  shield: Shield,
  file: FileText,
  clock: Clock,
  globe: Globe,
  star: Star,
  home: Home,
  users: Users,
  phone: Phone,
};

const borderColors = ["border-cyan-500", "border-emerald-500", "border-purple-500", "border-amber-500"];

function NetworkBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#0a1628]" />
      
      <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {[...Array(20)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </svg>
      
      {[...Array(80)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: ['#22d3ee', '#10b981', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 ${10 + Math.random() * 10}px currentColor`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  );
}

function MouseTrackingGrid() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const colors = ['#10b981', '#22d3ee', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];
  const gridSize = 12;
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={gridRef} className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <div 
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          width: '100%',
          height: '100%',
        }}
      >
        {[...Array(gridSize * gridSize)].map((_, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const cellCenterX = (col + 0.5) * (window.innerWidth / gridSize);
          const cellCenterY = (row + 0.5) * (window.innerHeight / gridSize);
          const distance = Math.sqrt(
            Math.pow(mousePos.x - cellCenterX, 2) + 
            Math.pow(mousePos.y - cellCenterY, 2)
          );
          const maxDistance = 300;
          const intensity = Math.max(0, 1 - distance / maxDistance);
          const colorIndex = (row + col) % colors.length;
          
          return (
            <motion.div
              key={index}
              className="relative"
              style={{
                background: intensity > 0 
                  ? `radial-gradient(circle at center, ${colors[colorIndex]}${Math.floor(intensity * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`
                  : 'transparent',
              }}
              animate={{
                scale: intensity > 0.3 ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {intensity > 0.2 && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: intensity, scale: intensity }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: colors[colorIndex],
                      boxShadow: `0 0 ${20 * intensity}px ${colors[colorIndex]}`,
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <motion.div
        className="absolute w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(34, 211, 238, 0.2) 30%, transparent 70%)',
          left: mousePos.x - 80,
          top: mousePos.y - 80,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

function MoonLandingIntro({ onComplete, branchName, introText, onStart, welcomeVoiceUrl }: { onComplete: () => void; branchName: string; introText?: string; onStart?: () => void; welcomeVoiceUrl?: string | null }) {
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Autoplay audio when component mounts and media is ready
  useEffect(() => {
    if (welcomeVoiceUrl && mediaRef.current) {
      mediaRef.current.load();
      // Try to autoplay after a short delay
      const autoplayTimer = setTimeout(() => {
        if (mediaRef.current && !isPlaying) {
          mediaRef.current.volume = 1.0;
          mediaRef.current.play()
            .then(() => {
              console.log('Audio autoplay successful');
              setIsPlaying(true);
            })
            .catch(err => {
              console.log('Autoplay blocked by browser, waiting for user interaction:', err.message);
            });
        }
      }, 100);
      return () => clearTimeout(autoplayTimer);
    }
  }, [welcomeVoiceUrl]);

  // Play custom voice audio when user clicks/taps on the intro screen (fallback if autoplay blocked)
  const playWelcomeVoice = useCallback(() => {
    if (welcomeVoiceUrl && mediaRef.current && !isPlaying) {
      setIsPlaying(true);
      mediaRef.current.currentTime = 0;
      mediaRef.current.volume = 1.0;
      mediaRef.current.play()
        .then(() => console.log('Audio playing successfully'))
        .catch(err => {
          console.error('Media play failed:', err);
          setIsPlaying(false);
        });
    }
  }, [welcomeVoiceUrl, isPlaying]);

  const handleMediaLoaded = useCallback(() => {
    setIsLoaded(true);
    console.log('Media loaded and ready to play');
    // Try autoplay when media is fully loaded
    if (mediaRef.current && !isPlaying) {
      mediaRef.current.play()
        .then(() => {
          console.log('Audio autoplay on load successful');
          setIsPlaying(true);
        })
        .catch(() => {
          console.log('Autoplay on load blocked, user tap required');
        });
    }
  }, [isPlaying]);

  const handleMediaEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (onStart) onStart();
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2500),
      setTimeout(() => setStage(4), 3500),
      setTimeout(() => onComplete(), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, onStart]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#0a1628] flex items-center justify-center overflow-hidden cursor-pointer"
      initial={{ opacity: 1 }}
      animate={{ opacity: stage >= 4 ? 0 : 1 }}
      transition={{ duration: 1 }}
      style={{ pointerEvents: stage >= 4 ? 'none' : 'auto' }}
      onClick={playWelcomeVoice}
    >
      {/* Hidden media element for audio playback */}
      {welcomeVoiceUrl && (
        welcomeVoiceUrl.toLowerCase().includes('.mp4') ? (
          <video 
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={welcomeVoiceUrl} 
            preload="auto"
            playsInline
            muted={false}
            onCanPlayThrough={handleMediaLoaded}
            onEnded={handleMediaEnded}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />
        ) : (
          <audio 
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={welcomeVoiceUrl} 
            preload="auto"
            onCanPlayThrough={handleMediaLoaded}
            onEnded={handleMediaEnded}
          />
        )
      )}
      
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-400"
        style={{ boxShadow: '0 0 60px rgba(200, 200, 200, 0.5)' }}
        initial={{ x: -200, y: -150, scale: 0.3 }}
        animate={{ 
          x: stage >= 1 ? 300 : -200,
          y: stage >= 1 ? -200 : -150,
          scale: stage >= 2 ? 0.1 : 0.3,
          opacity: stage >= 3 ? 0.3 : 1,
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <motion.div
        className="absolute"
        initial={{ y: -500, scale: 0.3, rotate: 0 }}
        animate={{ 
          y: stage >= 2 ? 100 : -500,
          scale: stage >= 3 ? 1.5 : 0.3,
          rotate: stage >= 2 ? 360 : 0,
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <motion.div
          className="relative"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Rocket className="w-20 h-20 text-emerald-400" style={{ transform: 'rotate(135deg)' }} />
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-emerald-500 via-green-400 to-transparent rounded-full blur-sm"
            animate={{ height: [40, 60, 40], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-emerald-900/30 via-teal-900/20 to-transparent"
        initial={{ y: 200, opacity: 0 }}
        animate={{ 
          y: stage >= 3 ? 0 : 200,
          opacity: stage >= 3 ? 1 : 0,
        }}
        transition={{ duration: 1.5 }}
      />

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: stage >= 3 ? 1 : 0,
          y: stage >= 3 ? 0 : 50,
        }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Building2 className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {branchName}
        </h1>
        <motion.p
          className="text-emerald-400/80 mt-4 text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          transition={{ delay: 0.3 }}
        >
          {introText || "Welcome to"}
        </motion.p>
        <motion.p
          className="text-gray-400 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          transition={{ delay: 0.8 }}
        >
          Landing in your world...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function AnimatedCounter({ value, duration = 2 }: { value: string; duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/\D/g, '')) || 0;

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = numericValue;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, numericValue, duration]);

  return (
    <span ref={ref}>
      {count}{value.includes('+') ? '+' : ''}{value.includes('%') ? '%' : ''}
    </span>
  );
}

function ContactBackgroundSlider({ customImages }: { customImages?: string[] }) {
  const [imageIndex, setImageIndex] = useState(0);
  
  const defaultImages = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&auto=format",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&auto=format",
  ];
  
  const images = customImages && customImages.length > 0 ? customImages : defaultImages;

  useEffect(() => {
    if (images.length <= 1) return;
    const imageTimer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => {
      clearInterval(imageTimer);
    };
  }, [images.length]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={imageIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${images[imageIndex]})` }}
          />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 bg-black/40" />
      
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </>
  );
}

function AppointmentBookingCard({ branch, playClick }: { branch: PropertyBranch; playClick: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    propertyName: '',
    visitDate: '',
    visitTime: '',
    paymentMethod: 'cash',
  });
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visitFee = branch.visitFee || parseFloat(branch.visitCharges) || 1000;
  const currency = branch.currency || 'PKR';
  
  // Build payment methods from database flags
  const paymentMethods: string[] = [];
  if (branch.cashOnDeliveryEnabled !== false) paymentMethods.push('cash');
  if (branch.easyPaisaEnabled) paymentMethods.push('easypaisa');
  if (branch.jazzCashEnabled) paymentMethods.push('jazzcash');
  if (branch.hblBankEnabled) paymentMethods.push('hbl_bank');
  if (paymentMethods.length === 0) paymentMethods.push('cash');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/property-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          ...formData,
          visitFee,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setBookingResult(result);
        setStep(3);
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'easypaisa': return '📱';
      case 'jazzcash': return '💳';
      case 'hbl_bank': return '🏦';
      case 'card': return '💳';
      default: return '💵';
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'easypaisa': return 'EasyPaisa';
      case 'jazzcash': return 'JazzCash';
      case 'hbl_bank': return 'HBL Bank Transfer';
      case 'cash': return 'Cash on Visit';
      default: return method;
    }
  };

  const getPaymentDetails = (method: string) => {
    switch (method) {
      case 'easypaisa': return branch.easyPaisaNumber ? `Account: ${branch.easyPaisaNumber}` : 'EasyPaisa available';
      case 'jazzcash': return branch.jazzCashNumber ? `Account: ${branch.jazzCashNumber}` : 'JazzCash available';
      case 'hbl_bank': return branch.hblAccountNumber ? `${branch.hblAccountTitle || 'Account'}: ${branch.hblAccountNumber}` : 'Bank Transfer';
      default: return 'Pay when you visit';
    }
  };

  return (
    <>
      <motion.div
        className="fixed right-4 bottom-24 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
      >
        <motion.button
          onClick={() => { setIsOpen(true); playClick(); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center"
        >
          <Calendar className="w-8 h-8 text-white" />
        </motion.button>
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Rs {(visitFee / 1000).toFixed(0)}K
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-gradient-to-br from-[#0d1f35] to-[#0a1628] rounded-3xl border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-center">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Appointment with Agent</h2>
                <p className="text-amber-100 text-sm mt-1">Visit Fee: {currency} {visitFee.toLocaleString()}</p>
              </div>

              <div className="p-6">
                {step === 1 && (
                  <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Your Name *</label>
                      <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Enter your name" className="bg-white/5 border-amber-500/30 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Phone Number *</label>
                      <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="+92 300 1234567" className="bg-white/5 border-amber-500/30 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Property to Visit *</label>
                      <Input value={formData.propertyName} onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })} placeholder="Property name or address" className="bg-white/5 border-amber-500/30 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Visit Date *</label>
                        <Input type="date" value={formData.visitDate} onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })} className="bg-white/5 border-amber-500/30 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Visit Time *</label>
                        <Input type="time" value={formData.visitTime} onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })} className="bg-white/5 border-amber-500/30 text-white" />
                      </div>
                    </div>
                    <Button onClick={() => { setStep(2); playClick(); }} disabled={!formData.customerName || !formData.customerPhone || !formData.propertyName || !formData.visitDate || !formData.visitTime} className="w-full bg-gradient-to-r from-amber-500 to-orange-600">
                      Continue to Payment <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Select Payment Method</h3>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <motion.button key={method} onClick={() => { setFormData({ ...formData, paymentMethod: method }); playClick(); }} whileHover={{ scale: 1.02 }} className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 ${formData.paymentMethod === method ? 'border-amber-500 bg-amber-500/20' : 'border-gray-600 bg-white/5'}`}>
                          <span className="text-2xl">{getPaymentIcon(method)}</span>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-white">{getPaymentLabel(method)}</div>
                            <div className="text-xs text-gray-400">{getPaymentDetails(method)}</div>
                          </div>
                          {formData.paymentMethod === method && <CheckCircle className="w-6 h-6 text-amber-500" />}
                        </motion.button>
                      ))}
                    </div>
                    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Visit Fee</span>
                        <span className="text-2xl font-bold text-amber-400">{currency} {visitFee.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-gray-600 text-gray-300">Back</Button>
                      <Button onClick={() => { handleSubmit(); playClick(); }} disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600">{isSubmitting ? 'Booking...' : 'Confirm Booking'}</Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && bookingResult && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: 2 }} className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-green-400">Booking Confirmed!</h3>
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
                      <div className="text-sm text-gray-400 mb-2">Your Visit Code</div>
                      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl font-bold text-amber-400 tracking-wider">{bookingResult.visit_code}</motion.div>
                    </div>
                    <div className="text-left bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Date:</span><span className="text-white">{formData.visitDate}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Time:</span><span className="text-white">{formData.visitTime}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Property:</span><span className="text-white">{formData.propertyName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Payment:</span><span className="text-amber-400">{getPaymentLabel(formData.paymentMethod)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span className="text-amber-400">{currency} {visitFee.toLocaleString()}</span></div>
                    </div>
                    {formData.paymentMethod !== 'cash' && (
                      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 text-left">
                        <h4 className="font-semibold text-blue-400 mb-2">Payment Instructions</h4>
                        <p className="text-sm text-gray-300">
                          {formData.paymentMethod === 'easypaisa' && branch.easyPaisaNumber && (
                            <>Please send {currency} {visitFee.toLocaleString()} to EasyPaisa: <span className="font-bold text-white">{branch.easyPaisaNumber}</span></>
                          )}
                          {formData.paymentMethod === 'jazzcash' && branch.jazzCashNumber && (
                            <>Please send {currency} {visitFee.toLocaleString()} to JazzCash: <span className="font-bold text-white">{branch.jazzCashNumber}</span></>
                          )}
                          {formData.paymentMethod === 'hbl_bank' && branch.hblAccountNumber && (
                            <>Please transfer {currency} {visitFee.toLocaleString()} to HBL Account: <span className="font-bold text-white">{branch.hblAccountNumber}</span> ({branch.hblAccountTitle})</>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Include your booking code <span className="text-amber-400">{bookingResult.visit_code}</span> in the transaction reference.</p>
                      </div>
                    )}
                    <p className="text-gray-400 text-sm">Our agent will contact you via WhatsApp to confirm your visit.</p>
                    <Button onClick={() => { setIsOpen(false); setStep(1); setBookingResult(null); playClick(); }} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">Done</Button>
                  </motion.div>
                )}
              </div>

              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface VideoLink {
  id: string;
  branchId: string;
  title: string;
  url: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

function TVNewsVideoSection({ 
  videoUrl, 
  branchName, 
  playClick,
  videoLinks = [],
  setCurrentVideoUrl
}: { 
  videoUrl?: string | null; 
  branchName: string; 
  playClick: () => void;
  videoLinks?: VideoLink[];
  setCurrentVideoUrl?: (url: string | null) => void;
}) {
  const propertyTourLinks = videoLinks.filter(v => v.category === 'property_tours');
  const marketUpdateLinks = videoLinks.filter(v => v.category === 'market_updates');
  
  const handleVideoClick = (url: string) => {
    playClick();
    if (setCurrentVideoUrl) {
      let embedUrl = url;
      if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
      }
      setCurrentVideoUrl(embedUrl);
      document.getElementById('property-tv')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <section id="property-tv" className="relative py-20 z-10">
      <div className="max-w-7xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50 mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-red-500"
            />
            <span className="text-red-400 text-sm font-medium">LIVE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Property TV News
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Watch our latest property tours and market updates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-3xl blur-lg opacity-30" />
          
          <div className="relative bg-[#0d1f35] rounded-3xl overflow-hidden border border-emerald-500/30">
            <div className="bg-gradient-to-r from-[#0d1f35] to-[#1a2f4a] px-4 py-2 flex items-center justify-between border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-white">{branchName} TV</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-red-400">REC</span>
                </motion.div>
              </div>
            </div>
            
            <div className="aspect-video relative bg-[#0a1628]">
              {videoUrl && videoUrl.trim() ? (
                <iframe
                  src={videoUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                  title="Property Video"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920')] bg-cover bg-center opacity-20" />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={playClick}
                    className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/50"
                  >
                    <PlayCircle className="w-12 h-12 text-white" />
                  </motion.button>
                  <p className="relative z-10 mt-4 text-gray-300">Click a video below to watch</p>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 py-2 px-4">
                <motion.div
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="text-white text-sm font-medium whitespace-nowrap"
                >
                  🏠 Breaking: New luxury properties available in DHA Phase 6 • 🏢 Commercial plaza now open for booking • 💰 Special discount on early bookings • 📞 Call now!
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Cards - Keep Simple */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-[#0d1f35]/80 rounded-2xl p-6 border border-cyan-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <div className="w-14 h-14 rounded-xl bg-cyan-500 flex items-center justify-center mb-4">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover:text-cyan-400 transition-colors">Property Tours</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>Watch Now</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-[#0d1f35]/80 rounded-2xl p-6 border border-emerald-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover:text-emerald-400 transition-colors">Market Updates</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>Watch Now</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => {
              playClick();
              document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative bg-[#0d1f35]/80 rounded-2xl p-6 border border-purple-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover:text-purple-400 transition-colors">Client Reviews</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>Watch Now</span>
            </div>
          </motion.div>
        </div>

        {/* Video Links Section - Landscape Layout Below Cards */}
        {(propertyTourLinks.length > 0 || marketUpdateLinks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mt-8"
          >
            {/* Property Tours Links */}
            <div className="bg-[#0d1f35]/60 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyan-500/20">
                <Video className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm">Property Tours</span>
              </div>
              <div className="space-y-2">
                {propertyTourLinks.map((link, index) => (
                  <motion.button
                    key={link.id}
                    whileHover={{ x: 5, backgroundColor: "rgba(6, 182, 212, 0.1)" }}
                    onClick={() => handleVideoClick(link.url)}
                    className="w-full flex items-center gap-3 text-left text-sm text-gray-300 hover:text-cyan-400 transition-all p-3 rounded-lg border border-transparent hover:border-cyan-500/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="truncate">{link.title}</span>
                  </motion.button>
                ))}
                {propertyTourLinks.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No videos yet</p>
                )}
              </div>
            </div>

            {/* Market Updates Links */}
            <div className="bg-[#0d1f35]/60 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">Market Updates</span>
              </div>
              <div className="space-y-2">
                {marketUpdateLinks.map((link, index) => (
                  <motion.button
                    key={link.id}
                    whileHover={{ x: 5, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                    onClick={() => handleVideoClick(link.url)}
                    className="w-full flex items-center gap-3 text-left text-sm text-gray-300 hover:text-emerald-400 transition-all p-3 rounded-lg border border-transparent hover:border-emerald-500/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="truncate">{link.title}</span>
                  </motion.button>
                ))}
                {marketUpdateLinks.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No videos yet</p>
                )}
              </div>
            </div>

            {/* Client Reviews Links Placeholder */}
            <div className="bg-[#0d1f35]/60 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-purple-500/20">
                <Camera className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-semibold text-sm">Client Reviews</span>
              </div>
              <div className="flex flex-col items-center justify-center py-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    playClick();
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span>View All Reviews</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface FeaturedProperty {
  id: string;
  title: string;
  location: string;
  price: string;
  type: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  videoUrl?: string;
  soldOut?: boolean;
  description?: string;
}

function FeaturedPropertiesCarousel({ 
  properties, 
  playHover, 
  playClick, 
  setSelectedVideoUrl 
}: { 
  properties: FeaturedProperty[]; 
  playHover: () => void; 
  playClick: () => void;
  setSelectedVideoUrl: (url: string | null) => void;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<FeaturedProperty | null>(null);
  const shouldCarousel = properties.length > 4;
  
  useEffect(() => {
    if (!shouldCarousel) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % properties.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [shouldCarousel, properties.length]);

  const borderColors = ["border-cyan-500", "border-emerald-500", "border-purple-500", "border-amber-500"];
  
  const displayProperties = shouldCarousel 
    ? [...properties.slice(carouselIndex), ...properties.slice(0, carouselIndex)].slice(0, 4)
    : properties;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {displayProperties.map((property, index) => (
          <motion.div
            key={property.id}
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -10 }}
            onMouseEnter={() => playHover()}
            onClick={() => playClick()}
            className={`group bg-[#0d1f35]/80 rounded-2xl overflow-hidden border-2 ${borderColors[index % borderColors.length]} cursor-pointer transition-all hover:shadow-lg relative`}
          >
            {property.soldOut && (
              <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                <span className="text-red-500 font-bold text-2xl rotate-[-15deg] border-4 border-red-500 px-4 py-2">SOLD OUT</span>
              </div>
            )}
            <div className="relative overflow-hidden">
              <motion.img
                src={property.image}
                alt={property.title}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                animate={shouldCarousel ? { x: [0, -5, 0] } : {}}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.type === 'Rent' ? 'bg-purple-500' : 'bg-emerald-500'} text-white`}>
                  For {property.type}
                </span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); playClick(); }}
                className="absolute top-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-red-500 transition-colors"
              >
                <Heart className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-white group-hover:text-emerald-400 transition-colors">{property.title}</h3>
              <p className="text-gray-400 flex items-center gap-1 text-sm mb-3">
                <MapPin className="w-3 h-3" /> {property.location}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                {property.beds > 0 && (
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" /> {property.beds}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Bath className="w-3 h-3" /> {property.baths}
                </span>
                <span className="flex items-center gap-1">
                  <Square className="w-3 h-3" /> {property.area}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-emerald-400 font-bold">{property.price}</span>
                <div className="flex gap-1">
                  {property.videoUrl && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-purple-400 hover:text-purple-300 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVideoUrl(property.videoUrl!);
                        document.getElementById('tv-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-emerald-400 hover:text-emerald-300 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProperty(property);
                      playClick();
                    }}
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Property Details Popup */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedProperty(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#0d1f35] rounded-2xl border border-emerald-500/30 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 z-10 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="relative">
                <img 
                  src={selectedProperty.image} 
                  alt={selectedProperty.title} 
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedProperty.type === 'Rent' ? 'bg-purple-500' : 'bg-emerald-500'} text-white`}>
                    For {selectedProperty.type}
                  </span>
                </div>
                {selectedProperty.soldOut && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-2xl">
                    <span className="text-red-500 font-bold text-xl rotate-[-15deg] border-4 border-red-500 px-4 py-2">SOLD OUT</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2">{selectedProperty.title}</h3>
                <p className="text-gray-400 flex items-center gap-1 text-sm mb-4">
                  <MapPin className="w-4 h-4" /> {selectedProperty.location}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-300 mb-4 pb-4 border-b border-white/10">
                  {selectedProperty.beds > 0 && (
                    <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                      <Bed className="w-4 h-4 text-cyan-400" /> {selectedProperty.beds} Beds
                    </span>
                  )}
                  <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                    <Bath className="w-4 h-4 text-cyan-400" /> {selectedProperty.baths} Baths
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                    <Square className="w-4 h-4 text-cyan-400" /> {selectedProperty.area}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-emerald-400">{selectedProperty.price}</span>
                </div>

                {selectedProperty.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Description</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedProperty.description}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                    onClick={() => {
                      window.open(`https://wa.me/?text=Hi, I'm interested in ${selectedProperty.title} at ${selectedProperty.location}`, '_blank');
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Contact via WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setSelectedProperty(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PropertyWebsite() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: branches = [] } = useQuery<PropertyBranch[]>({
    queryKey: ["/api/property-branches"],
  });

  const branch = branches.find(b => b.slug === slug);
  
  const { data: videoLinks = [] } = useQuery<{ id: string; branchId: string; title: string; url: string; category: string; displayOrder: number; isActive: boolean }[]>({
    queryKey: ["/api/property-branches", branch?.id, "video-links"],
    queryFn: async () => {
      if (!branch?.id) return [];
      const res = await fetch(`/api/property-branches/${branch.id}/video-links`);
      return res.json();
    },
    enabled: !!branch?.id,
  });
  
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const advantages = branch?.advantages || defaultAdvantages;
  const dynamicProperties = branch?.featuredProperties && branch.featuredProperties.length > 0 
    ? branch.featuredProperties 
    : featuredProperties.map(p => ({ ...p, id: String(p.id), videoUrl: '', soldOut: false }));
  
  // Get intro audio from video links (category: intro_audio)
  const introAudioLink = videoLinks.find(link => link.category === 'intro_audio' && link.isActive);
  const introAudioUrl = introAudioLink?.url || branch?.welcomeVoiceUrl;
  
  const introEnabled = branch?.introEnabled !== false;
  const introSoundEnabled = branch?.introSoundEnabled !== false;
  const clickSoundEnabled = branch?.clickSoundEnabled !== false;
  const hoverSoundEnabled = branch?.hoverSoundEnabled !== false;
  
  const [showIntro, setShowIntro] = useState(introEnabled);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  const [playIntroSound] = useSound("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3", { volume: 0.4 });
  const [playClickSound] = useSound("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", { volume: 0.5 });
  const [playHoverSound] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.2 });
  const [playWhoosh] = useSound("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3", { volume: 0.3 });

  const playClick = useCallback(() => {
    if (clickSoundEnabled) playClickSound();
  }, [clickSoundEnabled, playClickSound]);

  const playHover = useCallback(() => {
    if (hoverSoundEnabled) playHoverSound();
  }, [hoverSoundEnabled, playHoverSound]);
  
  useEffect(() => {
    if (branch) {
      setShowIntro(branch.introEnabled !== false);
    }
  }, [branch]);

  // Dynamic PWA manifest for this property branch
  useEffect(() => {
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]:not([sizes])');
    const originalIconHref = appleTouchIcon?.getAttribute('href');
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest && slug) {
      originalManifest.setAttribute('href', `/api/property-branches/${slug}/manifest.json`);
    }
    if (appleTouchIcon && branch) {
      const iconUrl = branch.appIconUrl || branch.logoUrl || '/icon-192.png';
      appleTouchIcon.setAttribute('href', iconUrl);
    }
    if (metaThemeColor && branch) {
      const themeColor = branch.appThemeColor || branch.primaryColor || '#0ea5e9';
      metaThemeColor.setAttribute('content', themeColor);
    }
    if (appleAppTitle && branch) {
      const appTitle = branch.appShortName || branch.name || 'Property';
      appleAppTitle.setAttribute('content', appTitle);
    }
    
    return () => {
      if (originalManifest && originalManifestHref) {
        originalManifest.setAttribute('href', originalManifestHref);
      }
      if (appleTouchIcon && originalIconHref) {
        appleTouchIcon.setAttribute('href', originalIconHref);
      }
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute('content', originalThemeColor);
      }
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute('content', originalAppleTitle);
      }
    };
  }, [slug, branch]);

  const speakAnnouncement = useCallback(() => {
    if ('speechSynthesis' in window && branch?.announcementEnabled !== false) {
      speechSynthesis.cancel();
      const text = branch?.announcementText || branch?.name || "Welcome";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.9;
      utterance.volume = 1;
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('james') ||
        v.name.toLowerCase().includes('google uk english male')
      );
      if (maleVoice) utterance.voice = maleVoice;
      speechSynthesis.speak(utterance);
    }
  }, [branch?.announcementText, branch?.announcementEnabled, branch?.name]);

  const handleIntroStart = useCallback(() => {
    // Sound disabled on page load - only plays on user click
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const heroImages = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&auto=format",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format",
  ];

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (!branch) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Building2 className="w-16 h-16 text-emerald-400" />
        </motion.div>
      </div>
    );
  }

  const branchName = branch.name;

  return (
    <div className="min-h-screen bg-[#0a1628] text-white overflow-x-hidden">
      <AnimatePresence>
        {showIntro && <MoonLandingIntro onComplete={handleIntroComplete} onStart={handleIntroStart} branchName={branchName} introText={branch.introText || undefined} welcomeVoiceUrl={branch.welcomeVoiceEnabled ? introAudioUrl : null} />}
      </AnimatePresence>

      <NetworkBackground />
      <MouseTrackingGrid />
      <AppointmentBookingCard branch={branch} playClick={playClick} />

      <motion.header
        style={{ backgroundColor: `rgba(10, 22, 40, ${headerOpacity})` }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-emerald-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
            onClick={() => playClick()}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              {branch.logoUrl ? (
                <img 
                  src={branch.logoUrl} 
                  alt={branchName} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}
            </motion.div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {branchName}
              </h1>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Properties", "Services", "About", "Contact"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => playHover()}
                onClick={() => playClick()}
                className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {branch.phone && (
              <a 
                href={`tel:${branch.phone}`} 
                onClick={() => playClick()}
                className="hidden md:flex items-center gap-2 text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {branch.phone}
              </a>
            )}
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); playClick(); }}
              className="md:hidden p-2 text-emerald-400"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a1628]/95 border-t border-emerald-500/20"
            >
              <div className="px-4 py-4 space-y-3">
                {["Home", "Properties", "Services", "About", "Contact"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block py-2 text-gray-300 hover:text-emerald-400"
                    onClick={() => { setMobileMenuOpen(false); playClick(); }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}
            />
            <div className="absolute inset-0 bg-[#0a1628]/60" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: showIntro ? 0 : 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 mb-6"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <motion.span 
                className="text-emerald-400 text-sm font-medium"
                animate={{ textShadow: ["0 0 5px #10b981", "0 0 15px #10b981", "0 0 5px #10b981"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {branch.heroTagline || "Premium Real Estate in Pakistan"}
              </motion.span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 0.9 }}
                className="block text-white"
              >
                {branch.heroTitle1 || "Find Your"}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: showIntro ? 0 : 1, 
                  y: showIntro ? 20 : 0,
                  scale: showIntro ? 0.8 : 1
                }}
                transition={{ delay: 1.1, type: "spring", stiffness: 100 }}
                className="block"
              >
                <motion.span 
                  className="bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(16, 185, 129, 0.5)",
                      "0 0 40px rgba(16, 185, 129, 0.8)",
                      "0 0 20px rgba(16, 185, 129, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontStyle: "italic" }}
                >
                  {branch.heroTitle2 || "Dream Property"}
                </motion.span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 1.3 }}
                className="block text-white"
              >
                {branch.heroTitle3 || "Faster"}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showIntro ? 0 : 1 }}
              transition={{ delay: 1.5 }}
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10"
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {branchName} {branch.heroDescription || "offers premium properties for sale and rent. Buy, sell, or rent with"} {branch.commissionRate}% commission.
              </motion.span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
              transition={{ delay: 1.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playClick();
                  document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
              >
                Browse Properties <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.8)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playClick();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full border-2 border-emerald-500/50 text-emerald-400 font-semibold text-lg flex items-center gap-2 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <Phone className="w-5 h-5" /> Contact Us
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span 
              className="font-medium mb-2 block"
              animate={{ 
                color: ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"],
                textShadow: ["0 0 10px #10b981", "0 0 15px #06b6d4", "0 0 10px #8b5cf6", "0 0 15px #f59e0b", "0 0 10px #10b981"]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {branch.servicesTagline || "Our Services"}
            </motion.span>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-4 text-white"
              animate={{ 
                textShadow: ["0 0 20px rgba(16,185,129,0.5)", "0 0 40px rgba(6,182,212,0.7)", "0 0 20px rgba(139,92,246,0.5)", "0 0 40px rgba(16,185,129,0.7)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {branch.servicesTitle || "What We Offer"}
            </motion.h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {branch.servicesDescription || "Comprehensive real estate solutions tailored to your needs"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {(branch.serviceCards || [
              { title: "Buy Property", description: "Find your dream home from our extensive collection.", icon: "home", color: "cyan" },
              { title: "Rent Property", description: "Discover premium rental properties with flexible terms.", icon: "key", color: "emerald" },
              { title: "Sell Property", description: "Get the best value for your property.", icon: "trending", color: "purple" }
            ]).map((card, index) => {
              const colorStyles: Record<string, { border: string; bg: string; iconBg: string; glow: string }> = {
                cyan: { border: "border-cyan-500/50", bg: "hover:bg-cyan-500/10", iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-600", glow: "#06b6d4" },
                emerald: { border: "border-emerald-500/50", bg: "hover:bg-emerald-500/10", iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600", glow: "#10b981" },
                purple: { border: "border-purple-500/50", bg: "hover:bg-purple-500/10", iconBg: "bg-gradient-to-br from-purple-500 to-purple-600", glow: "#8b5cf6" },
                amber: { border: "border-amber-500/50", bg: "hover:bg-amber-500/10", iconBg: "bg-gradient-to-br from-amber-500 to-amber-600", glow: "#f59e0b" },
                rose: { border: "border-rose-500/50", bg: "hover:bg-rose-500/10", iconBg: "bg-gradient-to-br from-rose-500 to-rose-600", glow: "#f43f5e" },
                blue: { border: "border-blue-500/50", bg: "hover:bg-blue-500/10", iconBg: "bg-gradient-to-br from-blue-500 to-blue-600", glow: "#3b82f6" },
              };
              const style = colorStyles[card.color] || colorStyles.cyan;
              const IconComponent = card.icon === "home" ? Home : card.icon === "key" ? Key : card.icon === "trending" ? TrendingUp : card.icon === "building" ? Building2 : card.icon === "map" ? MapPin : DollarSign;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onMouseEnter={() => playHover()}
                  onClick={() => playClick()}
                  className={`group relative bg-[#0d1f35]/80 rounded-2xl p-8 border-2 ${style.border} ${style.bg} cursor-pointer transition-all duration-300`}
                  style={{ boxShadow: `0 0 20px ${style.glow}30` }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${style.glow}20 0%, transparent 70%)` }}
                  />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`relative w-16 h-16 rounded-2xl ${style.iconBg} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="relative text-xl font-bold mb-3 text-white"
                    animate={{ 
                      color: ["#ffffff", style.glow, "#ffffff"],
                      textShadow: [`0 0 0px transparent`, `0 0 15px ${style.glow}`, `0 0 0px transparent`]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
                  >
                    {card.title}
                  </motion.h3>
                  <p className="relative text-gray-400 group-hover:text-gray-300 transition-colors">{card.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <TVNewsVideoSection 
        videoUrl={currentVideoUrl} 
        branchName={branchName} 
        playClick={playClick}
        videoLinks={videoLinks.filter(v => v.isActive)}
        setCurrentVideoUrl={setCurrentVideoUrl}
      />

      <section id="properties" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span 
              className="text-emerald-400 font-medium mb-2 block text-lg"
              animate={{ 
                color: ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"],
                textShadow: [
                  "0 0 10px #10b981",
                  "0 0 15px #06b6d4",
                  "0 0 10px #8b5cf6",
                  "0 0 15px #f59e0b",
                  "0 0 10px #10b981"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Featured Listings
            </motion.span>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-4 text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Featured Properties
            </motion.h2>
            <motion.p 
              className="text-gray-400 max-w-2xl mx-auto"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Explore our handpicked selection of premium properties
            </motion.p>
          </motion.div>

          <FeaturedPropertiesCarousel 
            properties={dynamicProperties} 
            playHover={playHover} 
            playClick={playClick}
            setSelectedVideoUrl={setSelectedVideoUrl}
          />
        </div>
      </section>

      <section id="about" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.05 }}
                onMouseEnter={() => playHover()}
                onClick={() => playClick()}
                className="text-center group cursor-pointer"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0d1f35] border-2 border-emerald-500/50 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all"
                >
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </motion.div>
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                  <AnimatedCounter value={stat.value} />
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span 
              className="text-emerald-400 font-medium mb-2 block text-lg"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.span
                animate={{ 
                  textShadow: [
                    "0 0 10px #10b981",
                    "0 0 20px #06b6d4",
                    "0 0 10px #8b5cf6",
                    "0 0 20px #10b981"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Why Choose Us
              </motion.span>
            </motion.span>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-4 text-white"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our Advantages
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(advantages.length > 0 ? advantages : defaultAdvantages).map((item, index) => {
              const IconComponent = iconMap[item.icon] || Shield;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onMouseEnter={() => playHover()}
                  onClick={() => playClick()}
                  className={`group text-center p-6 bg-[#0d1f35]/80 rounded-2xl border-2 ${borderColors[index % borderColors.length]} cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/20`}
                >
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg"
                  >
                    <IconComponent className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Client Reviews Section */}
      <section id="reviews" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-emerald-400 text-sm font-semibold tracking-wider uppercase">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">What Our Clients Say</h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Real experiences from satisfied customers who found their dream properties with us</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Ahmed Khan", role: "Property Buyer", review: "Excellent service! Found my dream home within a week. The team was professional and very helpful throughout the process.", rating: 5 },
              { name: "Fatima Ali", role: "Property Seller", review: "Sold my property at a great price. The marketing and negotiation skills of the team are exceptional.", rating: 5 },
              { name: "Hassan Raza", role: "Tenant", review: "Rented a beautiful apartment through them. Smooth process and great follow-up support even after moving in.", rating: 4 },
            ].map((client, index) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0d1f35]/80 rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-500 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < client.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{client.review}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{client.name}</h4>
                    <p className="text-sm text-gray-400">{client.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{
              background: 'linear-gradient(#0a1628, #0a1628) padding-box, linear-gradient(var(--angle), #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981) border-box',
              border: '3px solid transparent',
              animation: 'rotateBorder 4s linear infinite',
            }}
          >
            <style>{`
              @property --angle {
                syntax: '<angle>';
                initial-value: 0deg;
                inherits: false;
              }
              @keyframes rotateBorder {
                to { --angle: 360deg; }
              }
            `}</style>
            
            <div className="absolute inset-0 rounded-3xl" style={{
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(6, 182, 212, 0.2), 0 0 90px rgba(139, 92, 246, 0.1)',
              animation: 'pulseShadow 2s ease-in-out infinite alternate',
            }} />
            <style>{`
              @keyframes pulseShadow {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
              }
            `}</style>
            
            <ContactBackgroundSlider customImages={branch.contactBgImages} />
            
            <motion.div
              className="absolute top-4 right-4 w-20 h-20 z-10"
              animate={{
                x: [0, 20, 0, -20, 0],
                y: [0, -10, 0, 10, 0],
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              {branch.logoUrl ? (
                <img src={branch.logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                  <Building2 className="w-10 h-10 text-black" />
                </div>
              )}
            </motion.div>
            
            <motion.div
              className="absolute bottom-4 left-4 w-16 h-16 z-10 opacity-60"
              animate={{
                x: [0, -15, 0, 15, 0],
                y: [0, 10, 0, -10, 0],
                rotate: [0, -10, 0, 10, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              {branch.logoUrl ? (
                <img src={branch.logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-xl" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
            </motion.div>
            
            <motion.div
              className="absolute top-1/2 right-8 w-12 h-12 z-10 opacity-40"
              animate={{
                y: [0, -30, 0, 30, 0],
                rotate: [0, 360],
                scale: [0.8, 1, 0.8],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              {branch.logoUrl ? (
                <img src={branch.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-full h-full text-amber-400/50" />
              )}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10 pointer-events-none" />
            
            <div className="relative z-20 grid md:grid-cols-2 gap-12">
              <div className="relative">
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.span
                    animate={{ 
                      textShadow: [
                        "0 0 10px rgba(16, 185, 129, 0.5)",
                        "0 0 20px rgba(6, 182, 212, 0.5)",
                        "0 0 10px rgba(139, 92, 246, 0.5)",
                        "0 0 20px rgba(16, 185, 129, 0.5)",
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Get In Touch
                  </motion.span>
                </motion.h2>
                <motion.p 
                  className="text-gray-200 mb-8 drop-shadow-md"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Ready to find your perfect property? Contact us today!
                </motion.p>
                
                <div className="space-y-4">
                  {branch.address && (
                    <motion.div 
                      whileHover={{ x: 8 }}
                      onClick={() => playClick()}
                      className="flex items-start gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium mb-1 text-white">Address</p>
                        <p className="text-gray-400">{branch.address}</p>
                      </div>
                    </motion.div>
                  )}
                  {branch.phone && (
                    <motion.div 
                      whileHover={{ x: 8 }}
                      onClick={() => playClick()}
                      className="flex items-start gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium mb-1 text-white">Phone</p>
                        <p className="text-gray-400">{branch.phone}</p>
                      </div>
                    </motion.div>
                  )}
                  {branch.email && (
                    <motion.div 
                      whileHover={{ x: 8 }}
                      onClick={() => playClick()}
                      className="flex items-start gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium mb-1 text-white">Email</p>
                        <p className="text-gray-400">{branch.email}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {(branch.whatsappNumber || branch.phone) && (
                    <motion.a
                      href={`https://wa.me/${(branch.whatsappNumber || branch.phone || '').replace(/[^0-9]/g, '')}?text=Hello ${branch.ownerName || branchName}, I'm interested in your property services.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => playClick()}
                      className="flex items-start gap-4 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#25D366]/30 group-hover:shadow-[#25D366]/50 transition-shadow">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium mb-1 text-white group-hover:text-[#25D366] transition-colors">WhatsApp</p>
                        <p className="text-gray-400">{branch.whatsappNumber || branch.phone}</p>
                        <p className="text-xs text-[#25D366] mt-1">Click to chat with {branch.ownerName || 'us'}</p>
                      </div>
                    </motion.a>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Input 
                  placeholder="Your Name" 
                  onClick={() => playClick()}
                  className="bg-[#0a1628] border-emerald-500/30 h-12 focus:border-emerald-500 text-white" 
                />
                <Input 
                  placeholder="Your Email" 
                  onClick={() => playClick()}
                  className="bg-[#0a1628] border-emerald-500/30 h-12 focus:border-emerald-500 text-white" 
                />
                <Input 
                  placeholder="Your Phone" 
                  onClick={() => playClick()}
                  className="bg-[#0a1628] border-emerald-500/30 h-12 focus:border-emerald-500 text-white" 
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={4}
                  onClick={() => playClick()}
                  className="w-full px-4 py-3 bg-[#0a1628] border-2 border-emerald-500/30 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => playClick()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  Send Message <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="location" className="relative py-20 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium inline-flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" />
              Our Location
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Visit Our <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Office</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Find us at our office location. We're always ready to assist you with your property needs.
            </p>
          </motion.div>

          <motion.div
            className="relative rounded-3xl overflow-hidden border border-emerald-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.15)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />
            
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-2 h-[400px] relative">
                <iframe
                  src={branch.mapEmbedUrl || `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3619.6774321456!2d67.03081!3d24.8607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(branch.address || 'Property Office')}!5e0!3m2!1sen!2s!4v1699999999999!5m2!1sen!2s`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale contrast-125 opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-30" />
              </div>
              
              <div className="bg-gradient-to-br from-[#0d1f35] to-[#0a1628] p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  <motion.div 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{branchName}</h4>
                      <p className="text-gray-400 text-sm">Property Experts</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Office Address</h4>
                      <p className="text-gray-400 text-sm">{branch.address || 'Contact us for address'}</p>
                    </div>
                  </motion.div>

                  {branch.phone && (
                    <motion.div 
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Phone</h4>
                        <p className="text-gray-400 text-sm">{branch.phone}</p>
                      </div>
                    </motion.div>
                  )}

                  {branch.whatsappNumber && (
                    <motion.a
                      href={`https://wa.me/${branch.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/30 mt-4"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => playClick()}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat on WhatsApp
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms & Conditions Popup Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => { setShowTerms(false); playClick(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0d1f35] border border-emerald-500/30 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 bg-[#0d1f35] z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  Terms & Conditions
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowTerms(false); playClick(); }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </motion.button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">1. Introduction</h3>
                    <p>These Terms & Conditions govern the use of this website and all property-related services provided through it. By accessing or using this website, you agree to be bound by these Terms & Conditions.</p>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">2. Role of Developer (Mr. Mujeeb Sardar)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Mr. Mujeeb Sardar is the website and system developer only. He is not a property dealer, agent, broker, buyer, or seller.</li>
                      <li>The developer is not responsible or liable for any property dealings, negotiations, agreements, payments, disputes, or outcomes.</li>
                      <li>The developer does not verify property details, ownership, pricing, documents, or legal status.</li>
                      <li>All property-related decisions are made solely at the user's own risk.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">3. Role of Property Dealer</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All responsibility for property listings, communication, negotiations, documentation, commissions, and transactions lies entirely with the property dealer.</li>
                      <li>The property dealer is fully responsible for accuracy of information.</li>
                      <li>Any commission, fee, or charge is agreed directly between dealer and customer.</li>
                      <li>The platform acts only as a digital listing and communication medium.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">4. Buyer & Owner Responsibility</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Buyers and property owners must conduct their own due diligence before any transaction.</li>
                      <li>Payments, token money, advance, or full amounts are made at the buyer's own responsibility.</li>
                      <li>The website, developer, and platform owner are not responsible for payment loss, fraud, or disputes.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">5. Payments & Transfers</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Any payment made before or during property transfer is entirely at the parties' own risk.</li>
                      <li>The platform does not hold, process, or guarantee payments.</li>
                      <li>Users are advised to make payments through legal and documented channels only.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">6. Legal Compliance & FBR Regulations</h3>
                    <p className="mb-2">All property transactions must comply with the laws of Pakistan and applicable government regulations, including but not limited to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Transfer of Property Act 1954 (Pakistan)</li>
                      <li>Registration Act 1908</li>
                      <li>Stamp Act (as applicable in Punjab / relevant province)</li>
                      <li>Federal Board of Revenue (FBR) rules and regulations</li>
                    </ul>
                    <p className="mt-2">All property prices, payments, commissions, and fees are to be dealt in Pakistani Rupees (PKR) only.</p>
                    <p className="mt-2">Buyers, sellers, and property dealers are solely responsible for declaring correct property values, payment of applicable taxes, FBR property valuation compliance, Capital Value Tax (CVT), Capital Gains Tax (CGT), and any other government duties.</p>
                    <p className="mt-2">The website, platform owner, and developer do not collect taxes, do not verify FBR records, and do not provide tax or legal advice.</p>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">7. Communication Disclaimer</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All communication between buyer, seller, and property dealer occurs independently.</li>
                      <li>The developer and platform are not involved in communication or negotiations.</li>
                      <li>Any agreement reached is outside the platform's responsibility.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">8. Limitation of Liability</h3>
                    <p>Under no circumstances shall the developer, website owner, or platform be liable for: Financial loss, Legal disputes, Misrepresentation of property, Delays in possession or transfer, Any indirect or consequential damages.</p>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">9. Indemnity</h3>
                    <p>Users agree to indemnify and hold harmless the developer and platform from any claims, losses, damages, or legal actions arising from property dealings.</p>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">10. Developer Payment Terms & Suspension Rights</h3>
                    <p className="mb-2">If any client, property dealer, or company has entered into a separate development or service payment agreement with Mr. Mujeeb Sardar for website or web app development:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All agreed development or service payments must be paid on time as per the agreed schedule.</li>
                      <li>If payment remains unpaid for a continuous period of two (2) months, the developer reserves the full right to suspend or block access to the web app, remove the web app or website from public access, and disable admin or user access.</li>
                      <li>During suspension, the developer is not responsible for business loss, data access interruption, or customer complaints.</li>
                      <li>Service will only be restored once all outstanding dues are fully cleared.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">11. Changes to Terms</h3>
                    <p>These Terms & Conditions may be updated at any time without prior notice. Continued use of the website constitutes acceptance of the revised terms.</p>
                  </div>

                  <div>
                    <h3 className="text-emerald-400 font-semibold mb-2">12. Governing Law</h3>
                    <p>These Terms & Conditions shall be governed by and interpreted in accordance with the laws of Pakistan.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative py-12 border-t border-emerald-500/20 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3" onClick={() => playClick()}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">{branchName}</span>
            </div>
            
            <div className="flex items-center gap-4">
              {branch.facebookUrl && (
                <motion.a 
                  href={branch.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playClick()}
                  className="p-2 bg-[#0d1f35] border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Facebook className="w-5 h-5 text-emerald-400" />
                </motion.a>
              )}
              {branch.instagramUrl && (
                <motion.a 
                  href={branch.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playClick()}
                  className="p-2 bg-[#0d1f35] border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Instagram className="w-5 h-5 text-emerald-400" />
                </motion.a>
              )}
              {branch.twitterUrl && (
                <motion.a 
                  href={branch.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playClick()}
                  className="p-2 bg-[#0d1f35] border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Twitter className="w-5 h-5 text-emerald-400" />
                </motion.a>
              )}
              {branch.youtubeUrl && (
                <motion.a 
                  href={branch.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => playClick()}
                  className="p-2 bg-[#0d1f35] border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Youtube className="w-5 h-5 text-emerald-400" />
                </motion.a>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={() => { setShowTerms(true); playClick(); }}
                className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors cursor-pointer underline underline-offset-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Terms & Conditions
              </motion.button>
              
              <motion.div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); playClick(); }}
                className="text-gray-400 text-sm hover:text-emerald-400 transition-colors cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Powered by <span className="text-emerald-400 font-medium">Mujeeb Ai</span>
                <span className="block text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  Mujeeb Sardar: 0044 7427070000
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
