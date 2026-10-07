import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, ShieldCheck, Car, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Zap, Globe, Shield, Sofa, ShoppingCart, LogOut, Building2, Wand2, Monitor, Shirt, BookOpen, Bot, Wifi, Phone } from "lucide-react";
import { useLocation } from "wouter";
import useSound from "use-sound";

const slides = [
  {
    id: 1,
    title: "Multi-Restaurant Management",
    subtitle: "One Platform, Unlimited Possibilities",
    description: "Manage all your restaurants from a single powerful dashboard. Real-time orders, bookings, and analytics.",
    gradient: "from-purple-600 via-blue-500 to-cyan-400",
    icon: Globe,
  },
  {
    id: 2,
    title: "Real-Time Order Tracking",
    subtitle: "Stay Connected, Stay Informed",
    description: "WebSocket-powered live updates. Audio notifications for new orders. Never miss a customer again.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: Zap,
  },
  {
    id: 3,
    title: "Driver Delivery System",
    subtitle: "Complete Delivery Management",
    description: "Track drivers in real-time, manage assignments, and ensure timely deliveries with our integrated system.",
    gradient: "from-orange-500 via-red-500 to-pink-500",
    icon: Car,
  },
  {
    id: 4,
    title: "Food Safety Compliance",
    subtitle: "Trust & Quality Guaranteed",
    description: "Built-in allergen management, customer tracking, and compliance tools for your peace of mind.",
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    icon: Shield,
  },
];

const portalCards = [
  {
    id: "restaurant",
    title: "Restaurant Dashboard",
    description: "Manage live orders, bookings, and kitchen workflow in real-time.",
    icon: ChefHat,
    href: "/shop-login",
    gradient: "from-emerald-400 to-cyan-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "driver",
    title: "Driver Portal",
    description: "View deliveries, update status, and navigate with GPS.",
    icon: Car,
    href: "/driver-login",
    gradient: "from-orange-400 to-red-500",
    glowColor: "rgba(251, 146, 60, 0.4)",
  },
  {
    id: "admin",
    title: "Super Admin",
    description: "Manage all restaurants, menus, and global settings.",
    icon: ShieldCheck,
    href: "/portal-admin",
    gradient: "from-blue-400 to-indigo-600",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "furniture",
    title: "Super Admin Furniture",
    description: "Bed, Mattress, Wardrobe, Sofa, Dining Set, Coffee Table, Mirror, Washing Machine, Fridge …. etc.",
    icon: Sofa,
    href: "/admin-furniture",
    gradient: "from-amber-400 to-orange-600",
    glowColor: "rgba(251, 191, 36, 0.4)",
  },
  {
    id: "grocery",
    title: "Super Admin Online Grocery Shopping",
    description: "We believe shoppers deserve real food—picked for taste, quality, and sustainability, not just perfect looks.",
    icon: ShoppingCart,
    href: "/admin-grocery",
    gradient: "from-green-400 to-emerald-600",
    glowColor: "rgba(34, 197, 94, 0.4)",
  },
  {
    id: "property",
    title: "Buy and Rent Property Faster",
    description: "KING'S PROPERTY GROUP - Premium real estate in Pakistan. Buy, sell, or rent residential & commercial properties with 25% commission.",
    icon: Building2,
    href: "/property-super-admin",
    gradient: "from-cyan-400 to-blue-600",
    glowColor: "rgba(14, 165, 233, 0.5)",
  },
  {
    id: "ai-studio",
    title: "AI Creative Studio",
    description: "Generate AI images, merge product photos, create GIFs & videos, and format text for marketing.",
    icon: Wand2,
    href: "/ai-studio",
    gradient: "from-purple-400 to-pink-600",
    glowColor: "rgba(168, 85, 247, 0.5)",
  },
  {
    id: "shop-display-menus",
    title: "Shop Display Menus",
    description: "Design TV/monitor menu boards for your restaurant. Multiple screens, auto-rotating slides, background music & live updates.",
    icon: Monitor,
    href: "/shop-display-menus",
    gradient: "from-blue-400 to-cyan-600",
    glowColor: "rgba(59, 130, 246, 0.5)",
  },
  {
    id: "taxi-admin",
    title: "Taxi Super Admin",
    description: "Manage all taxi brands, approve drivers, monitor rides, resolve complaints, and track payments.",
    icon: Car,
    href: "/taxi-admin",
    gradient: "from-amber-400 to-orange-600",
    glowColor: "rgba(245, 158, 11, 0.5)",
  },
  {
    id: "clothing-admin",
    title: "Clothing E-Commerce",
    description: "Manage clothing brands, product catalogs with multi-view images, pricing, categories & online orders.",
    icon: Shirt,
    href: "/clothing-admin",
    gradient: "from-pink-400 to-rose-600",
    glowColor: "rgba(236, 72, 153, 0.5)",
  },
  {
    id: "quran-admin",
    title: "Quran Academy",
    description: "Manage Quran academies, students, recitation sessions with speech recognition & mistake detection.",
    icon: BookOpen,
    href: "/admin-quran",
    gradient: "from-emerald-400 to-green-600",
    glowColor: "rgba(16, 185, 129, 0.5)",
  },
  {
    id: "mujeeb-ai",
    title: "Marketing AI — Mujeeb Agent",
    description: "Meet Mujeeb AI Agent — your 24/7 AI assistant that builds complete web apps from just an idea. No coding, no teams, no waiting.",
    icon: Bot,
    href: "/mujeeb-ai",
    gradient: "from-blue-400 via-cyan-400 to-purple-600",
    glowColor: "rgba(59, 130, 246, 0.5)",
  },
  {
    id: "smart-devices",
    title: "Smart Device Management",
    description: "Manage SCHICC aroma diffusers & IoT devices. Multi-brand support, customer portals, device controls, timers & schedules.",
    icon: Wifi,
    href: "/admin-devices",
    gradient: "from-cyan-400 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.5)",
  },
  {
    id: "link24-phone",
    title: "Link24 Phone",
    description: "Hosted phone system for shops. AI voice IVR, call recording, hold music, web app + desk phone options. UK numbers from £1/month via Voipfone. Plans £8-£25/mo.",
    icon: Phone,
    href: "/link24-phone-login",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    glowColor: "rgba(99, 102, 241, 0.5)",
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();
  const [playClick] = useSound("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", { volume: 0.3 });
  const [playHover] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.15 });

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    if (adminLoggedIn !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleCardClick = () => {
    playClick();
  };

  const handleCardHover = () => {
    playHover();
  };

  return (
    <div className="min-h-screen premium-gradient-bg relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="gradient-mesh" />

      {/* Premium Navigation */}
      <nav className="nav-premium fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="icon-3d w-12 h-12">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Food & Safety MS
            </span>
          </motion.div>

          <motion.div 
            className="hidden md:flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {["Features", "Pricing", "About", "Contact"].map((item, index) => (
              <button
                key={item}
                className="nav-item-premium relative z-10"
                onClick={handleCardClick}
                onMouseEnter={handleCardHover}
                data-testid={`nav-${item.toLowerCase()}`}
              >
                <span className="relative z-10">{item}</span>
              </button>
            ))}
            <Link href="/">
              <button
                className="nav-item-premium relative z-10 flex items-center gap-2 ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors"
                onClick={() => {
                  localStorage.removeItem("adminLoggedIn");
                  localStorage.removeItem("adminEmail");
                }}
                data-testid="nav-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="relative z-10">Log Out</span>
              </button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24">
        {/* Hero Slider Section */}
        <section className="min-h-[60vh] flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl w-full mx-auto">
            <div className="relative overflow-hidden rounded-3xl">
              {/* Slider Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm z-10" />

              {/* Slides */}
              <AnimatePresence mode="wait">
                {slides.map((slide, index) => (
                  index === currentSlide && (
                    <motion.div
                      key={slide.id}
                      className={`relative min-h-[400px] md:min-h-[500px] bg-gradient-to-br ${slide.gradient} p-8 md:p-16`}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    >
                      <div className="relative z-20 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                        {/* Text Content */}
                        <div className="flex-1 text-white space-y-6">
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">{slide.subtitle}</span>
                          </motion.div>

                          <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-4xl md:text-6xl font-bold leading-tight"
                          >
                            {slide.title}
                          </motion.h1>

                          <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-lg md:text-xl text-white/80 max-w-xl"
                          >
                            {slide.description}
                          </motion.p>

                          <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="btn-3d-premium inline-flex items-center gap-2"
                            onClick={handleCardClick}
                            onMouseEnter={handleCardHover}
                            data-testid="button-get-started"
                          >
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                          </motion.button>
                        </div>

                        {/* Icon */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="flex-shrink-0 animate-float"
                        >
                          <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                            <slide.icon className="w-16 h-16 md:w-24 md:h-24 text-white" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                      <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Slider Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
                <button
                  onClick={() => { prevSlide(); handleCardClick(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
                  data-testid="button-prev-slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => { setCurrentSlide(index); handleCardClick(); }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide 
                          ? "bg-white w-8" 
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                      data-testid={`slide-dot-${index}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => { nextSlide(); handleCardClick(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
                  data-testid="button-next-slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Cards Section */}
        <section className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Choose Your Portal
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Access the right dashboard for your role. Each portal is designed for maximum efficiency.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {portalCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={card.href}>
                    <div
                      className="card-3d-luxury h-full cursor-pointer group"
                      onClick={handleCardClick}
                      onMouseEnter={handleCardHover}
                      data-testid={`card-${card.id}`}
                    >
                      {/* Icon */}
                      <div 
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        style={{ boxShadow: `0 8px 30px ${card.glowColor}` }}
                      >
                        <card.icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-400 group-hover:via-blue-400 group-hover:to-cyan-400 transition-all">
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-6">
                        {card.description}
                      </p>

                      {/* Button */}
                      <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                        <span>Enter Portal</span>
                        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Real-Time Updates", description: "WebSocket-powered live order notifications", icon: Zap, color: "text-yellow-400" },
                { title: "Multi-Branch", description: "Manage unlimited restaurant locations", icon: Globe, color: "text-blue-400" },
                { title: "Secure & Reliable", description: "Enterprise-grade security and uptime", icon: Shield, color: "text-green-400" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className={`icon-3d mx-auto mb-4 ${feature.color}`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2024 Food & Safety MS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Support"].map((item) => (
                <button
                  key={item}
                  className="text-gray-500 text-sm hover:text-white transition-colors"
                  onClick={handleCardClick}
                  onMouseEnter={handleCardHover}
                  data-testid={`footer-${item.toLowerCase()}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
