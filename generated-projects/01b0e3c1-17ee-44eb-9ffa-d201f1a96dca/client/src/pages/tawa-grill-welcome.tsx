import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { getRestaurantBySlug, createBooking, getPopularItems } from "@/lib/api";
import type { PopularItem } from "@shared/schema";
import { MapPin, Clock, Phone, ChevronDown, Sparkles, Crown, Flame, Star, ArrowRight, Utensils, Loader2, Calendar, X, Users } from "lucide-react";
import { useSubdomainSlug } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

// Generate opening hours from restaurant data
const getOpeningHours = (restaurant: any) => {
  const monThuHours = restaurant?.deliveryHoursMonThu || '04:00pm - 11:00pm';
  const friSatHours = restaurant?.deliveryHoursFriSat || '12:00pm - 11:00pm';
  const sunHours = restaurant?.deliveryHoursSun || '12:00pm - 11:00pm';
  
  return [
    { day: 'Monday', hours: monThuHours },
    { day: 'Tuesday', hours: monThuHours },
    { day: 'Wednesday', hours: monThuHours },
    { day: 'Thursday', hours: monThuHours },
    { day: 'Friday', hours: friSatHours },
    { day: 'Saturday', hours: friSatHours },
    { day: 'Sunday', hours: sunHours },
  ];
};

const getFeatures = (restaurantName: string) => [
  { icon: Flame, title: `Authentic ${restaurantName.split(' ')[0] || 'Restaurant'} Cooking`, gradient: 'from-orange-500 via-red-500 to-pink-500' },
  { icon: Crown, title: 'Premium Quality', gradient: 'from-amber-400 via-yellow-500 to-orange-400' },
  { icon: Sparkles, title: 'Fresh Ingredients', gradient: 'from-emerald-400 via-teal-500 to-cyan-400' },
];

export default function TawaGrillWelcome() {
  const [, setLocation] = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  // Booking states
  const [showBookingCard, setShowBookingCard] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [bookingTime, setBookingTime] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingCountryCode, setBookingCountryCode] = useState("+44");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ["/api/restaurants/slug", slug],
    queryFn: () => getRestaurantBySlug(slug),
    enabled: !!slug,
  });

  const { data: featuredItems = [] } = useQuery<PopularItem[]>({
    queryKey: ["/api/popular-items", restaurant?.id],
    queryFn: () => getPopularItems(restaurant!.id),
    enabled: !!restaurant?.id,
  });

  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => createBooking(bookingData),
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleOrderNow = () => {
    // Navigate to the menu page using valid route /menu/:slug
    setLocation(`/menu/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!slug || !restaurant || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
        <p className="text-white/70 mb-6">The restaurant you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation('/')} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Animated Background with Sliding Gradients */}
      <div className="fixed inset-0 z-0">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Animated color orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -50, 100, 50, 0],
            scale: [1, 1.2, 1, 1.3, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff6b35 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, -150, 50, 100, 0],
            y: [0, 100, -50, 0, 0],
            scale: [1, 1.3, 1, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #c87533 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            x: [0, 80, -80, 0],
            y: [0, -80, 80, 0],
            scale: [1, 1.4, 1, 1.2, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #e8a965 0%, transparent 70%)' }}
        />
        
        {/* Shimmer lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear", delay: i * 1.5 }}
              className="absolute h-[2px] w-1/3"
              style={{
                top: `${20 + i * 15}%`,
                background: `linear-gradient(90deg, transparent, rgba(200,117,51,0.8), transparent)`,
              }}
            />
          ))}
        </div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(200,117,51,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200,117,51,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-20, -100, -20],
                  x: [0, Math.random() * 40 - 20, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
                className="absolute w-1 h-1 bg-orange-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${50 + Math.random() * 50}%`,
                }}
              />
            ))}
          </div>

          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium tracking-widest uppercase">Premium Dining Experience</span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </motion.div>

          {/* Restaurant Logo */}
          {restaurant?.logoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-6"
            >
              <motion.img 
                src={restaurant.logoUrl}
                alt={restaurant.name}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-2xl mx-auto"
                style={{ 
                  border: '4px solid rgba(255,140,0,0.6)',
                  boxShadow: '0 0 40px rgba(255,107,53,0.4)'
                }}
              />
            </motion.div>
          )}

          {/* Main Title with 3D Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mb-6"
          >
            {/* Glow effect behind text */}
            <div className="absolute inset-0 flex items-center justify-center blur-3xl opacity-50">
              <h1 className="text-5xl md:text-7xl font-black text-orange-500">
                {(restaurant?.name || "Restaurant").split(' ')[0].toUpperCase()}
              </h1>
            </div>
            
            {/* Main text with gradient and 3D shadow */}
            <h1 
              className="relative text-5xl md:text-7xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 25%, #ff6347 50%, #ff4500 75%, #c87533 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 5s ease infinite',
                textShadow: '0 0 80px rgba(255,107,53,0.5)',
              }}
            >
              {(restaurant?.name || "Restaurant").split(' ')[0].toUpperCase()}
            </h1>
            <motion.h2 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-white/90 -mt-2 md:-mt-4"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              }}
            >
              {(restaurant?.name || "").split(' ').slice(1).join(' ').toUpperCase() || ""}
            </motion.h2>
          </motion.div>

          {/* Tagline with animated underline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-8"
          >
            <p className="text-xl md:text-2xl text-amber-100/80 tracking-[0.3em] uppercase font-light">
              {(restaurant as any)?.cuisineType || "Fine Dining Experience"}
            </p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="h-[2px] w-48 mx-auto mt-4 origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, #c87533, #ff6b35, #c87533, transparent)' }}
            />
          </motion.div>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-xl text-white/50 italic mb-12 font-light"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "{(restaurant as any)?.tagline || 'Where every bite feels like home'}"
          </motion.p>

          {/* CTA Buttons with 3D hover effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={handleOrderNow}
              className="group relative px-12 py-7 text-xl font-bold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(255,107,53,0.5)]"
              style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #c87533 50%, #e8a965 100%)',
                boxShadow: '0 10px 40px rgba(200,117,51,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              data-testid="button-order-now"
            >
              <span className="relative z-10 flex items-center gap-3 text-white">
                <Utensils className="w-6 h-6" />
                Order Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleOrderNow}
              className="group px-10 py-7 text-xl font-semibold rounded-2xl border-2 border-amber-500/50 bg-white/5 backdrop-blur-sm text-amber-100 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,193,7,0.3)]"
              data-testid="button-view-menu"
            >
              <Star className="w-5 h-5 mr-2 text-amber-400" />
              View Menu
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 1.5 }, y: { duration: 2, repeat: Infinity } }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-amber-500/60" />
          </motion.div>
        </div>
      </section>

      {/* Featured Items Section */}
      {featuredItems.length > 0 && (
        <section className="relative z-10 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 
                className="text-3xl md:text-4xl font-bold text-white mb-4" 
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">Featured</span> Dishes
              </h2>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredItems.filter(item => item.isActive).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  onClick={() => item.linkUrl && setLocation(item.linkUrl)}
                  className={`relative group overflow-hidden rounded-2xl aspect-square ${item.linkUrl ? 'cursor-pointer' : ''}`}
                  style={{
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}
                  data-testid={`featured-item-${item.id}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0 flex items-end justify-center pb-4"
                    style={{
                      background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)'
                    }}
                  >
                    <span 
                      className="text-white text-sm md:text-base font-semibold tracking-wide text-center px-3"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ 
                      border: '2px solid rgba(255, 193, 7, 0.6)',
                      borderRadius: 'inherit'
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section with 3D Cards */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">{restaurant?.name || "Us"}</span>
            </h2>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {getFeatures(restaurant?.name || "Restaurant").map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                whileHover={{ 
                  y: -10, 
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
                style={{ perspective: '1000px' }}
              >
                <div 
                  className="relative p-8 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient}`} />
                  
                  {/* Icon with gradient background */}
                  <div className={`w-20 h-20 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60">Experience the authentic taste of tradition with our carefully crafted dishes.</p>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Opening Hours */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(200,117,51,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(200,117,51,0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Opening Hours
                </h3>
              </div>
              
              <div className="space-y-4">
                {getOpeningHours(restaurant).map((item: { day: string; hours: string }, idx: number) => (
                  <motion.div
                    key={item.day}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex justify-between items-center py-3 border-b border-white/10 last:border-0"
                  >
                    <span className="text-white/80">{item.day}</span>
                    <span className="text-amber-400 font-medium">{item.hours}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(200,117,51,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(200,117,51,0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Find Us
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Address</p>
                    <p className="text-white/60">{restaurant?.address || "Address not available"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <a href={`tel:${restaurant?.phone?.replace(/\s/g, '') || ''}`} className="text-amber-400 hover:text-amber-300 transition-colors">
                      {restaurant?.phone || "Phone not available"}
                    </a>
                  </div>
                </div>

                {/* Map - uses restaurant's googleMapsUrl or falls back to address search */}
                <div className="mt-6 h-48 rounded-2xl overflow-hidden border border-white/10">
                  <iframe
                    src={restaurant?.googleMapsUrl || `https://www.google.com/maps?q=${encodeURIComponent(restaurant?.address || '')}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(50%) contrast(1.1)' }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">Experience</span> the Taste?
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Order now and discover why {restaurant?.name || "we are"} is the premier destination for authentic cuisine.
          </p>
          <Button
            size="lg"
            onClick={handleOrderNow}
            className="group px-16 py-8 text-2xl font-bold rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #c87533 50%, #e8a965 100%)',
              boxShadow: '0 20px 60px rgba(200,117,51,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            data-testid="button-order-online"
          >
            <span className="relative z-10 flex items-center gap-4 text-white">
              Order Online Now
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </span>
          </Button>
        </motion.div>
      </section>

      {/* Floating Book Table Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowBookingCard(!showBookingCard)}
          className="px-6 py-4 text-lg font-bold rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #c87533 0%, #e8a965 50%, #c87533 100%)',
            boxShadow: '0 10px 40px rgba(200,117,51,0.5)',
          }}
        >
          <Calendar className="w-5 h-5 mr-2" />
          {showBookingCard ? "Hide Booking" : "Book a Table"}
        </Button>
      </div>

      {/* Floating Booking Card */}
      <AnimatePresence>
        {showBookingCard && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed right-6 bottom-24 z-50 w-80 max-h-[80vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.98) 0%, rgba(15, 28, 46, 0.98) 100%)',
              border: '1px solid rgba(200,117,51,0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {bookingSubmitted ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Booking Received!</h3>
                <p className="text-white/70 text-sm mb-4">
                  Your booking request has been submitted. Please wait for the manager to confirm your reservation via WhatsApp.
                </p>
                <div className="p-3 rounded-lg bg-blue-900/50 border border-amber-500/20 mb-4">
                  <p className="text-white/60 text-xs mb-1">You will receive confirmation at:</p>
                  <p className="text-white font-medium">{bookingCountryCode} {bookingPhone}</p>
                </div>
                <Button
                  onClick={() => {
                    setBookingSubmitted(false);
                    setShowBookingCard(false);
                  }}
                  variant="outline"
                  className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-amber-400">Book a Table</h3>
                  <button 
                    onClick={() => setShowBookingCard(false)}
                    className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-amber-300 hover:bg-blue-800/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-amber-200 mb-1">Date</label>
                      <Popover open={bookingCalendarOpen} onOpenChange={setBookingCalendarOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 px-3 text-sm bg-blue-900/50 border border-amber-500/30 rounded-md flex items-center gap-2 text-left hover:bg-blue-800/50 transition-colors"
                          >
                            <Calendar className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            <span className={bookingDate ? "text-white" : "text-white/50"}>
                              {bookingDate ? format(new Date(bookingDate), "dd/MM/yyyy") : "Select"}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-amber-500/30" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={bookingDate ? new Date(bookingDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setBookingDate(format(date, "yyyy-MM-dd"));
                              }
                              setBookingCalendarOpen(false);
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-200 mb-1">Time</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full h-10 px-2 text-sm border rounded-md bg-blue-900/50 border-amber-500/30 text-white"
                      >
                        <option value="" className="bg-slate-800">Select</option>
                        <option value="12:00" className="bg-slate-800">12:00 PM</option>
                        <option value="13:00" className="bg-slate-800">1:00 PM</option>
                        <option value="14:00" className="bg-slate-800">2:00 PM</option>
                        <option value="17:00" className="bg-slate-800">5:00 PM</option>
                        <option value="18:00" className="bg-slate-800">6:00 PM</option>
                        <option value="19:00" className="bg-slate-800">7:00 PM</option>
                        <option value="20:00" className="bg-slate-800">8:00 PM</option>
                        <option value="21:00" className="bg-slate-800">9:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-amber-500/20">
                      <span className="text-sm text-white">Adults</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAdults(Math.max(0, adults - 1))} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{adults}</span>
                        <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-amber-500/20">
                      <span className="text-sm text-white">Children <span className="text-xs text-white/50">(2-12)</span></span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{children}</span>
                        <button onClick={() => setChildren(children + 1)} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-amber-500/20">
                      <span className="text-sm text-white">Infants <span className="text-xs text-white/50">(0-2)</span></span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setInfants(Math.max(0, infants - 1))} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{infants}</span>
                        <button onClick={() => setInfants(infants + 1)} className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/20 text-sm">+</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-200 mb-1">Name *</label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="h-10 text-sm bg-blue-900/50 border-amber-500/30 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-200 mb-1">Phone * (WhatsApp)</label>
                    <div className="flex gap-2">
                      <select
                        value={bookingCountryCode}
                        onChange={(e) => setBookingCountryCode(e.target.value)}
                        className="w-24 h-10 px-2 text-sm border rounded-md bg-blue-900/50 border-amber-500/30 text-white"
                      >
                        <option value="+44" className="bg-slate-800">GB +44</option>
                        <option value="+1" className="bg-slate-800">US +1</option>
                        <option value="+91" className="bg-slate-800">IN +91</option>
                        <option value="+92" className="bg-slate-800">PK +92</option>
                        <option value="+971" className="bg-slate-800">AE +971</option>
                        <option value="+33" className="bg-slate-800">FR +33</option>
                        <option value="+49" className="bg-slate-800">DE +49</option>
                      </select>
                      <Input
                        type="tel"
                        placeholder="Phone number"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 h-10 text-sm bg-blue-900/50 border-amber-500/30 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-200 mb-1">Email</label>
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      className="h-10 text-sm bg-blue-900/50 border-amber-500/30 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-amber-200 mb-1">♿ Special Assistance / Accessibility Needs</label>
                    <textarea
                      placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                      value={bookingSpecialRequests}
                      onChange={(e) => setBookingSpecialRequests(e.target.value)}
                      className="w-full h-16 px-3 py-2 text-sm border rounded-md bg-blue-900/50 border-amber-500/30 text-white placeholder:text-white/50 resize-none"
                    />
                  </div>

                  <Button
                    onClick={async () => {
                      if (!bookingDate || !bookingTime || !bookingName || !bookingPhone) {
                        toast({ title: "Please fill in all required fields", variant: "destructive" });
                        return;
                      }
                      try {
                        await createBookingMutation.mutateAsync({
                          restaurantId: restaurant.id,
                          date: bookingDate,
                          time: bookingTime,
                          guests: adults + children + infants,
                          adults,
                          children,
                          infants,
                          customerName: bookingName,
                          phone: `${bookingCountryCode}${bookingPhone}`,
                          email: bookingEmail || "not-provided@example.com",
                          specialHelp: bookingSpecialRequests,
                          status: "pending",
                        });
                        setBookingSubmitted(true);
                      } catch (error) {
                        toast({ title: "Booking failed", description: "Please try again", variant: "destructive" });
                      }
                    }}
                    className="w-full h-12 text-base font-bold rounded-xl text-slate-900"
                    style={{ background: 'linear-gradient(135deg, #c87533 0%, #e8a965 50%, #c87533 100%)' }}
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Submitting..." : "Confirm Booking"}
                  </Button>

                  <p className="text-xs text-white/50 text-center">
                    Manager will confirm via WhatsApp
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            © 2025 {restaurant?.name || "Restaurant"}. All rights reserved. | {(restaurant as any)?.cuisineType || "Fine Dining"}
          </p>
        </div>
      </footer>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
