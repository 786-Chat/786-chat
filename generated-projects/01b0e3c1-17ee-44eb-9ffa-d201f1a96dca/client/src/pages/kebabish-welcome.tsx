import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { getRestaurantBySlug, getPopularItems } from "@/lib/api";
import type { PopularItem } from "@shared/schema";
import { MapPin, Clock, Phone, ArrowRight, Loader2, Calendar } from "lucide-react";
import { useSubdomainSlug } from "@/App";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const COLOR_THEMES = [
  { name: "Pakistani", colors: ["#01411C", "#FFFFFF", "#01411C"], gradient: "from-green-800 via-white to-green-800" },
  { name: "Indian", colors: ["#FF9933", "#FFFFFF", "#138808"], gradient: "from-orange-500 via-white to-green-600" },
  { name: "Bengali", colors: ["#006A4E", "#F42A41", "#006A4E"], gradient: "from-green-700 via-red-500 to-green-700" },
  { name: "British", colors: ["#012169", "#FFFFFF", "#C8102E"], gradient: "from-blue-900 via-white to-red-600" },
  { name: "K.O. Fire", colors: ["#DC2626", "#FF6B35", "#FFD700"], gradient: "from-red-600 via-orange-500 to-yellow-500" },
];

const getOpeningHours = (restaurant: any) => {
  const monThuHours = restaurant?.deliveryHoursMonThu || '04:00pm - 11:00pm';
  const friSatHours = restaurant?.deliveryHoursFriSat || '12:00pm - 11:00pm';
  const sunHours = restaurant?.deliveryHoursSun || '12:00pm - 11:00pm';
  
  return [
    { day: 'Monday - Thursday', hours: monThuHours },
    { day: 'Friday - Saturday', hours: friSatHours },
    { day: 'Sunday', hours: sunHours },
  ];
};

export default function KebabishWelcome() {
  const [, setLocation] = useLocation();
  const [currentTheme, setCurrentTheme] = useState(0);
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTheme((prev) => (prev + 1) % COLOR_THEMES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderNow = () => {
    setLocation(`/menu/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!slug || !restaurant || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
        <p className="text-white/70 mb-6">The restaurant you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation('/')} variant="outline">Go Home</Button>
      </div>
    );
  }

  const theme = COLOR_THEMES[currentTheme];
  const branchCity = (restaurant as any).branchCity || "Our Location";

  return (
    <div className="min-h-screen overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-0"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-30`} />
          <div className="absolute inset-0 bg-slate-950/80" />
          
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: theme.colors[i % 3],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {COLOR_THEMES.map((t, idx) => (
          <motion.button
            key={t.name}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentTheme(idx)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              currentTheme === idx ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]})` }}
            title={t.name}
          />
        ))}
      </div>

      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, duration: 1 }}
            className="mb-8"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 30px ${theme.colors[0]}50`,
                  `0 0 60px ${theme.colors[1]}80`,
                  `0 0 30px ${theme.colors[2]}50`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block rounded-full p-2"
            >
              <motion.img
                src={restaurant?.logoUrl || "/attached_assets/kologoheader_1767549304977.png"}
                alt={restaurant?.name || "K.O. Kebabish"}
                className="w-48 h-auto mx-auto"
                animate={{
                  filter: [
                    `drop-shadow(0 0 20px ${theme.colors[0]})`,
                    `drop-shadow(0 0 40px ${theme.colors[1]})`,
                    `drop-shadow(0 0 20px ${theme.colors[2]})`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <p className="text-white/70 text-lg uppercase tracking-widest mb-2">YOU ARE ORDERING FROM OUR</p>
            <motion.h2
              animate={{ 
                color: [theme.colors[0], theme.colors[1], theme.colors[2], theme.colors[0]],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-5xl md:text-6xl font-black uppercase"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              {branchCity} BRANCH
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 text-white/80 mb-8"
          >
            <MapPin className="w-5 h-5 text-orange-400" />
            <span>{restaurant.address}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleOrderNow}
                size="lg"
                className="text-xl px-12 py-8 rounded-full font-bold relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[2]})`,
                }}
                data-testid="button-order-now"
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors[2]}, ${theme.colors[0]})`,
                  }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  Order Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setLocation(`/menu/${slug}?booking=true`)}
                size="lg"
                variant="outline"
                className="text-xl px-12 py-8 rounded-full font-bold relative overflow-hidden group border-2"
                style={{
                  borderColor: theme.colors[1],
                  color: 'white',
                  background: 'rgba(0,0,0,0.3)',
                }}
                data-testid="button-book-table"
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[2]})`,
                  }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  <Calendar className="w-6 h-6" />
                  Book a Table
                </span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Featured Items Section */}
          {featuredItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mb-12 max-w-4xl mx-auto w-full px-4"
            >
              <h3 
                className="text-center text-xl md:text-2xl font-bold tracking-wider uppercase mb-6"
                style={{ color: theme.colors[0] }}
              >
                Featured Dishes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredItems.filter(item => item.isActive).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    onClick={() => item.linkUrl && setLocation(item.linkUrl)}
                    className={`relative group cursor-pointer overflow-hidden rounded-lg aspect-square ${item.linkUrl ? 'hover:scale-105' : ''}`}
                    style={{
                      border: `1px solid ${theme.colors[0]}40`,
                      transition: 'all 0.3s ease'
                    }}
                    data-testid={`featured-item-${item.id}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute inset-0 flex items-end justify-center pb-3"
                      style={{
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)'
                      }}
                    >
                      <span 
                        className="text-white text-xs md:text-sm font-medium tracking-wide text-center px-2"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        {item.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            <div 
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{ 
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${theme.colors[0]}40`,
              }}
            >
              <Clock className="w-8 h-8 mx-auto mb-4" style={{ color: theme.colors[0] }} />
              <h3 className="text-white font-bold text-lg mb-4">Opening Hours</h3>
              <div className="space-y-2 text-white/80 text-sm">
                {getOpeningHours(restaurant).map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.day}</span>
                    <span>{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{ 
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${theme.colors[2]}40`,
              }}
            >
              <Phone className="w-8 h-8 mx-auto mb-4" style={{ color: theme.colors[2] }} />
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              <div className="space-y-2 text-white/80">
                {restaurant.phone && <p>{restaurant.phone}</p>}
                {restaurant.email && <p>{restaurant.email}</p>}
                <p className="text-xs mt-4 opacity-70">{restaurant.address}</p>
              </div>
            </div>
          </motion.div>

          {/* Location Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div 
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{ 
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${theme.colors[1]}40`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="w-8 h-8" style={{ color: theme.colors[1] }} />
                <h3 className="text-white font-bold text-lg">Find Us</h3>
              </div>
              <p className="text-white/80 text-sm mb-4 text-center">{restaurant.address}</p>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.address || '')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Restaurant Location"
                  className="w-full"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium hover:underline"
                style={{ color: theme.colors[1] }}
                data-testid="link-directions"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 text-white/50 text-sm"
          >
            <p>Theme: <span className="font-bold" style={{ color: theme.colors[0] }}>{theme.name}</span></p>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="mt-12 pt-8 border-t border-white/10 text-center"
          >
            <div className="text-white/70 text-sm space-y-2">
              <p>&copy; 2026 {restaurant.name}. All rights reserved.</p>
              <p className="text-white/50">Developer Mujeeb Sardar</p>
              <a href="/terms" className="text-yellow-400 hover:text-yellow-300 underline">
                Terms & Conditions
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
