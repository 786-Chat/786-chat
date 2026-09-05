import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
import useSound from "use-sound";
import { 
  Building2, MapPin, Phone, Mail, ChevronRight, ChevronLeft, 
  Home, Key, FileText, Users, Award, Shield, Star, Search,
  Bed, Bath, Square, Heart, Play, ArrowRight, CheckCircle,
  Building, Landmark, TrendingUp, Clock, Globe, Sparkles,
  Facebook, Instagram, Youtube, Twitter, Menu, X, Rocket, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  },
];

const services = [
  {
    icon: Home,
    title: "Buy Property",
    description: "Find your dream home from our extensive collection of residential and commercial properties across Pakistan.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Key,
    title: "Rent Property",
    description: "Discover premium rental properties with flexible terms and transparent pricing for your comfort.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: TrendingUp,
    title: "Sell Property",
    description: "Get the best value for your property with our expert valuation and marketing services.",
    color: "from-purple-500 to-indigo-600",
  },
];

const stats = [
  { value: "500+", label: "Properties Listed", icon: Building },
  { value: "250+", label: "Happy Clients", icon: Users },
  { value: "15+", label: "Years Experience", icon: Award },
  { value: "100%", label: "Client Satisfaction", icon: Star },
];

const testimonials = [
  {
    name: "Ahmed Khan",
    role: "Property Buyer",
    content: "King's Property Group helped me find my dream home in DHA. Their professional team made the entire process smooth and hassle-free.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format",
    rating: 5,
  },
  {
    name: "Fatima Ali",
    role: "Property Seller",
    content: "Excellent service! They sold my property within 2 weeks at a great price. Highly recommend their expertise and dedication.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format",
    rating: 5,
  },
  {
    name: "Hassan Malik",
    role: "Commercial Client",
    content: "Best real estate agency in Lahore! Their knowledge of commercial properties is unmatched. Professional and reliable.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format",
    rating: 5,
  },
];

const whyChooseUs = [
  { icon: Shield, title: "Verified Properties", description: "All listings are thoroughly verified for authenticity" },
  { icon: FileText, title: "Legal Assistance", description: "Complete documentation and legal support provided" },
  { icon: Clock, title: "24/7 Support", description: "Round the clock customer support for all queries" },
  { icon: Globe, title: "Wide Network", description: "Extensive network across major cities of Pakistan" },
];

function FlowingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {[...Array(8)].map((_, i) => (
          <motion.path
            key={i}
            d={`M-100,${100 + i * 120} Q${200 + i * 50},${50 + i * 80} ${500 + i * 100},${150 + i * 100} T${1000 + i * 150},${100 + i * 120} T${1500 + i * 100},${200 + i * 80} T2000,${150 + i * 100}`}
            stroke="url(#riverGradient)"
            strokeWidth={2 + i * 0.5}
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0.1, 0.4, 0.1],
              pathOffset: [0, 1]
            }}
            transition={{ 
              duration: 8 + i * 2, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 0.5
            }}
          />
        ))}
      </svg>
      
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: `rgba(${Math.random() > 0.5 ? '14, 165, 233' : '16, 185, 129'}, ${Math.random() * 0.5 + 0.2})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,10,20,0.8)_100%)]" />
    </div>
  );
}

function MoonLandingIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2500),
      setTimeout(() => setStage(4), 3500),
      setTimeout(() => onComplete(), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#000a14] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: stage >= 4 ? 0 : 1 }}
      transition={{ duration: 1 }}
      style={{ pointerEvents: stage >= 4 ? 'none' : 'auto' }}
    >
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
        className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(200, 200, 200, 0.5)' }}
        initial={{ x: -200, y: -150, scale: 0.3 }}
        animate={{ 
          x: stage >= 1 ? 300 : -200,
          y: stage >= 1 ? -200 : -150,
          scale: stage >= 2 ? 0.1 : 0.3,
          opacity: stage >= 3 ? 0.3 : 1,
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gray-400/50"
              style={{
                width: 10 + Math.random() * 20,
                height: 10 + Math.random() * 20,
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      </motion.div>

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
          <Rocket className="w-20 h-20 text-cyan-400" style={{ transform: 'rotate(135deg)' }} />
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent rounded-full blur-sm"
            animate={{ height: [40, 60, 40], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-cyan-900/50 via-blue-900/30 to-transparent"
        initial={{ y: 200, opacity: 0 }}
        animate={{ 
          y: stage >= 3 ? 0 : 200,
          opacity: stage >= 3 ? 1 : 0,
        }}
        transition={{ duration: 1.5 }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920')] bg-cover bg-center opacity-30 rounded-t-[100%]" />
      </motion.div>

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
          <Building2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
          KING'S PROPERTY
        </h1>
        <p className="text-cyan-400/80 text-lg mt-2">GROUP</p>
        <motion.p
          className="text-gray-400 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          transition={{ delay: 0.5 }}
        >
          Landing in your world...
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute bottom-10 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 3 ? 1 : 0 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-cyan-400"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
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

export default function PropertyLandingPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  const [playIntro] = useSound("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3", { volume: 0.4 });
  const [playClick] = useSound("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", { volume: 0.3 });
  const [playHover] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.15 });

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        playIntro();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showIntro, playIntro]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProperties.length);
    }, 5000);
    return () => clearInterval(timer);
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

  return (
    <div className="min-h-screen bg-[#000a14] text-white overflow-x-hidden">
      <AnimatePresence>
        {showIntro && <MoonLandingIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <FlowingBackground />

      <motion.header
        style={{ backgroundColor: `rgba(0, 10, 20, ${headerOpacity})` }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-cyan-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
            >
              <Building2 className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                KING'S PROPERTY
              </h1>
              <p className="text-[10px] text-cyan-400/70 tracking-widest">GROUP</p>
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
                className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/property-super-admin">
              <Button 
                onClick={() => playClick()}
                className="hidden md:flex bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
              >
                Super Admin
              </Button>
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); playClick(); }}
              className="md:hidden p-2 text-cyan-400"
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
              className="md:hidden bg-[#000a14]/95 border-t border-cyan-500/10"
            >
              <div className="px-4 py-4 space-y-3">
                {["Home", "Properties", "Services", "About", "Contact"].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block py-2 text-gray-300 hover:text-cyan-400"
                    onClick={() => { setMobileMenuOpen(false); playClick(); }}
                  >
                    {item}
                  </a>
                ))}
                <Link href="/property-super-admin">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold mt-2">
                    Super Admin
                  </Button>
                </Link>
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
            <div className="absolute inset-0 bg-gradient-to-b from-[#000a14]/90 via-[#000a14]/70 to-[#000a14]" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                background: `rgba(${Math.random() > 0.5 ? '14, 165, 233' : '16, 185, 129'}, 0.6)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ 
                y: [0, -200],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{ 
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Premium Real Estate in Pakistan</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 0.9 }}
                className="block text-white"
              >
                Find Your
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 1.1 }}
                className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-400 bg-clip-text text-transparent"
              >
                Dream Property
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 1.3 }}
                className="block text-white"
              >
                Faster
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: showIntro ? 0 : 1 }}
              transition={{ delay: 1.5 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              KING'S PROPERTY GROUP brings you the finest residential and commercial 
              properties across Pakistan. Buy, sell, or rent with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
              transition={{ delay: 1.7 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto border border-cyan-500/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select>
                  <SelectTrigger className="bg-white/10 border-cyan-500/30 text-white">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="plot">Plot</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="bg-white/10 border-cyan-500/30 text-white">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lahore">Lahore</SelectItem>
                    <SelectItem value="karachi">Karachi</SelectItem>
                    <SelectItem value="islamabad">Islamabad</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="bg-white/10 border-cyan-500/30 text-white">
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50l">Under 50 Lac</SelectItem>
                    <SelectItem value="1cr">50 Lac - 1 Crore</SelectItem>
                    <SelectItem value="5cr">1 - 5 Crore</SelectItem>
                    <SelectItem value="10cr">5+ Crore</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => playClick()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 h-10"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showIntro ? 0 : 1 }}
            transition={{ delay: 2 }}
            className="mt-16 flex justify-center gap-8 flex-wrap"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 20 : 0 }}
                transition={{ delay: 2.1 + i * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="text-center cursor-pointer"
                onMouseEnter={() => playHover()}
              >
                <div className="text-3xl md:text-4xl font-bold text-cyan-400">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-cyan-400/50 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      <section id="services" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Our Services</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              What We <span className="text-cyan-400">Offer</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comprehensive real estate services tailored to meet your property needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                onMouseEnter={() => playHover()}
                onClick={() => playClick()}
                className="group relative bg-gradient-to-b from-white/5 to-transparent rounded-2xl p-8 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="relative text-2xl font-bold mb-4">{service.title}</h3>
                <p className="relative text-gray-400 mb-6">{service.description}</p>
                <motion.a
                  href="#"
                  className="relative inline-flex items-center text-cyan-400 font-medium group-hover:gap-3 gap-2 transition-all"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </motion.a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="properties" className="py-24 bg-gradient-to-b from-[#000a14] via-[#001020] to-[#000a14]">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center mb-16"
          >
            <div>
              <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Featured Listings</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4">
                Premium <span className="text-cyan-400">Properties</span>
              </h2>
            </div>
            <Button 
              onClick={() => playClick()}
              variant="outline" 
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 mt-4 md:mt-0"
            >
              View All Properties <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                onMouseEnter={() => playHover()}
                onClick={() => playClick()}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      property.type === 'Sale' 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-emerald-500 text-white'
                    }`}>
                      For {property.type}
                    </span>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {property.location}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    {property.beds > 0 && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" /> {property.beds} Beds
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" /> {property.baths} Baths
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="w-3 h-3" /> {property.area}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{property.price}</span>
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 p-0">
                      Details <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-emerald-600/20" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&auto=format')] bg-cover bg-center opacity-10" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Why Choose Us</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                The Best Real Estate <span className="text-cyan-400">Partner</span>
              </h2>
              <p className="text-gray-400 mb-8">
                With over 15 years of experience in Pakistan's real estate market, we bring 
                unmatched expertise and dedication to every property transaction.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {whyChooseUs.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onMouseEnter={() => playHover()}
                    className="flex gap-4 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format"
                  alt="Luxury Property"
                  className="w-full rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -left-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-2xl"
              >
                <div className="text-white">
                  <div className="text-4xl font-bold">25%</div>
                  <div className="text-sm font-medium">Commission Rate</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                onClick={() => playClick()}
                className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-4 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                  <div>
                    <div className="font-semibold">Virtual Tour</div>
                    <div className="text-xs text-gray-400">Watch Now</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-[#000a14] via-[#001020] to-[#000a14]">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">
              What Our <span className="text-cyan-400">Clients Say</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
                onMouseEnter={() => playHover()}
                className="bg-white/5 rounded-2xl p-8 border border-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-cyan-400 text-cyan-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/50"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-transparent to-emerald-600/10" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 md:p-12 border border-cyan-500/20"
          >
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">Get In Touch</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                  Ready to Find Your <span className="text-cyan-400">Dream Property?</span>
                </h2>
                <p className="text-gray-400 mb-8">
                  Contact us today for a free consultation. Our expert team is ready to 
                  help you with all your real estate needs.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Call Us</div>
                      <div className="font-semibold">+92 333 4111575</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Email Us</div>
                      <div className="font-semibold">faisalchaudhary1714@gmail.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Visit Us</div>
                      <div className="font-semibold">Gate # 4 Main Blvd, City Center Plaza # 28, Hassan Commercial, 1st Floor, Al Rehman Garden Phase 2, Lahore, Pakistan</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Your Name"
                      className="bg-white/10 border-cyan-500/30 text-white placeholder:text-gray-500"
                    />
                    <Input
                      placeholder="Phone Number"
                      className="bg-white/10 border-cyan-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Input
                    placeholder="Email Address"
                    type="email"
                    className="bg-white/10 border-cyan-500/30 text-white placeholder:text-gray-500"
                  />
                  <Select>
                    <SelectTrigger className="bg-white/10 border-cyan-500/30 text-white">
                      <SelectValue placeholder="I'm interested in..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buying Property</SelectItem>
                      <SelectItem value="sell">Selling Property</SelectItem>
                      <SelectItem value="rent">Renting Property</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-cyan-500/30 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <Button 
                    onClick={() => playClick()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 h-12"
                  >
                    Send Message <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-400">KING'S PROPERTY</h3>
                  <p className="text-[10px] text-gray-500">GROUP</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Premium real estate services in Pakistan. Your trusted partner for buying, 
                selling, and renting properties.
              </p>
              <div className="flex gap-3 mt-4">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    onMouseEnter={() => playHover()}
                    onClick={() => playClick()}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Home", "Properties", "Services", "About Us", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-cyan-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Property Types</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Houses", "Apartments", "Commercial", "Plots", "Farmhouses"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-cyan-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Popular Cities</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-cyan-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-cyan-500/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2024 King's Property Group. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
