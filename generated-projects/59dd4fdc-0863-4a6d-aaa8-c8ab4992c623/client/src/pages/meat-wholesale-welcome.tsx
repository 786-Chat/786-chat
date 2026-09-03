import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone, MapPin, Clock, Truck, Award, ShieldCheck, Star, ChevronLeft, ChevronRight, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const softClickSound = () => {
  const audio = new Audio("data:audio/wav;base64,UklGRl9vT19teleVAAAAV0FWRWZtdCAQAAAAAQABAJYEAACWBAAABABIAAAAZGF0YQ");
  audio.volume = 0.1;
  audio.play().catch(() => {});
};

const heroProducts = [
  { id: 1, name: "Premium Beef", image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400", color: "#8B0000" },
  { id: 2, name: "Fresh Lamb", image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400", color: "#a50000" },
  { id: 3, name: "Farm Chicken", image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400", color: "#c50000" },
  { id: 4, name: "Goat Meat", image: "https://images.unsplash.com/photo-1602473812169-36f8e72a2c69?w=400", color: "#8B0000" },
];

const mealCategories = [
  { name: "Wholesale", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600", desc: "Bulk orders for businesses" },
  { name: "Family Packs", image: "https://images.unsplash.com/photo-1602473812169-36f8e72a2c69?w=600", desc: "Perfect for home cooking" },
  { name: "Premium Cuts", image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600", desc: "Restaurant quality meats" },
];

const testimonials = [
  { name: "Ahmed's Kitchen", text: "Best quality meat supplier we've worked with. Fresh, reliable, and great prices for wholesale.", rating: 5 },
  { name: "The Grill House", text: "Our customers love the quality. Meat Wholesale has been our trusted supplier for 3 years.", rating: 5 },
  { name: "Family Butchers", text: "Excellent service and premium cuts. Highly recommend for any restaurant or business.", rating: 5 },
];

export default function MeatWholesaleWelcome() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants", "meat-wholesale"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants/slug/meat-wholesale");
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterMenu = () => {
    softClickSound();
    setLocation("/meat-wholesale/menu");
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-900 overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a0000]/95 via-[#2a0808]/95 to-[#1a0000]/95 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center shadow-lg shadow-[#FFD700]/30 overflow-hidden">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name || "Meat Wholesale"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🥩</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">MEAT WHOLESALE</h1>
              <p className="text-xs text-[#FFD700]/80">Premium Fresh Cuts</p>
            </div>
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Products", "About", "Contact"].map((item) => (
              <motion.a
                key={item}
                whileHover={{ scale: 1.1, color: "#FFD700" }}
                className="text-white/80 hover:text-[#FFD700] font-medium cursor-pointer transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="tel:07427070000"
              className="hidden md:flex items-center gap-2 text-white/80 hover:text-[#FFD700] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>07427 070000</span>
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnterMenu}
              className="px-6 py-2 bg-[#FFD700] text-[#1a0000] font-bold rounded-full hover:bg-[#B8860B] transition-colors shadow-lg"
            >
              Order Now
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Section 1: Hero with Curved Bottom */}
      <section className="relative pt-20 min-h-[90vh] overflow-hidden">
        <motion.div 
          style={{ y: heroY }}
          className="absolute inset-0 bg-gradient-to-br from-[#1a0000] via-[#4a0000] to-[#8B0000]"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-40 h-40 border border-white/20 rounded-full" />
            <div className="absolute top-40 right-20 w-60 h-60 border border-white/10 rounded-full" />
            <div className="absolute bottom-40 left-1/4 w-32 h-32 border border-white/15 rounded-full" />
          </div>
        </motion.div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              DISCOVER <span className="text-[#FFD700]">PREMIUM</span> MEATS
            </h2>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
              Supplying the finest quality fresh meats to restaurants, butchers & families across the region
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-72 md:w-80 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD700]/50"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#B8860B" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnterMenu}
              className="px-8 py-3 bg-[#FFD700] text-[#1a0000] font-bold rounded-full shadow-lg shadow-[#FFD700]/30"
            >
              BROWSE
            </motion.button>
          </motion.div>

          {/* Circular Product Images */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-6 md:gap-10"
          >
            {heroProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -10 }}
                className="group relative cursor-pointer"
                onClick={handleEnterMenu}
              >
                <div className="w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-full overflow-hidden border-4 border-[#FFD700]/30 group-hover:border-[#FFD700] shadow-2xl shadow-black/50 transition-all duration-300">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-4"
                >
                  <span className="text-white font-bold text-sm md:text-base">{product.name}</span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              fill="#ffffff"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Section 2: Our Best Popular Products */}
      <section className="relative py-20 bg-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 text-9xl text-[#8B0000]">🥩</div>
          <div className="absolute bottom-10 left-10 text-8xl text-[#8B0000]">🍖</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-[#1a0000] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              OUR BEST <span className="text-[#8B0000]">POPULAR</span> PRODUCTS
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#8B0000] mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {mealCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={handleEnterMenu}
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0000]/90 via-transparent to-transparent" />
                </div>
                <div className="text-center mt-4">
                  <h3 className="text-xl font-bold text-[#1a0000] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{category.desc}</p>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="mt-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#8B0000] text-white shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(139,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnterMenu}
              className="px-10 py-4 bg-[#FFD700] text-[#1a0000] font-bold text-lg rounded-full shadow-lg"
            >
              Order Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Why Choose Us - Curved Top */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto rotate-180">
            <path
              fill="#ffffff"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
        
        <div className="bg-gradient-to-br from-[#8B0000] via-[#6a0000] to-[#4a0000] pt-20 pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                WHY <span className="text-[#FFD700]">CHOOSE</span> US
              </h2>
              <div className="w-24 h-1 bg-[#FFD700] mx-auto rounded-full" />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Truck, title: "Fast Delivery", desc: "Same day available" },
                { icon: Award, title: "Premium Quality", desc: "Handpicked cuts" },
                { icon: ShieldCheck, title: "Halal Certified", desc: "100% guaranteed" },
                { icon: Star, title: "Since 1995", desc: "Family business" },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-[#FFD700]/50 transition-all cursor-pointer"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg">
                    <item.icon className="w-8 h-8 text-[#1a0000]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              fill="#ffffff"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </section>

      {/* Section 4: Testimonials */}
      <section className="relative py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-[#1a0000] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              TESTIMONIALS
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#8B0000] mx-auto rounded-full" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-[#8B0000] mb-4">{testimonials[currentTestimonial].name}</h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6 italic">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>
              <div className="text-4xl text-[#FFD700]">"</div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentTestimonial
                    ? "bg-[#FFD700] scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#1a0000] via-[#2a0808] to-[#1a0000] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
                  <span className="text-2xl">🥩</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">MEAT WHOLESALE</h3>
                  <p className="text-xs text-[#FFD700]/80">Premium Fresh Cuts</p>
                </div>
              </div>
              <p className="text-white/60 text-sm">
                Supplying premium quality fresh meats since 1995. Your trusted partner for wholesale and retail meat supply.
              </p>
            </div>

            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4 text-[#FFD700]" />
                  <span>88 Black Nall Lane, WS3 1HX</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <Phone className="w-4 h-4 text-[#FFD700]" />
                  <span>07427 070000</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <Clock className="w-4 h-4 text-[#FFD700]" />
                  <span>Mon-Sat: 8AM - 6PM</span>
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
              <div className="flex flex-wrap justify-center md:justify-end gap-4">
                {["Home", "Products", "About", "Contact"].map((link) => (
                  <motion.a
                    key={link}
                    whileHover={{ scale: 1.1, color: "#FFD700" }}
                    className="text-white/70 hover:text-[#FFD700] cursor-pointer transition-colors"
                  >
                    {link}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/50 text-sm">
              © 2026 Meat Wholesale. All Rights Reserved. | Powered by Link24
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
