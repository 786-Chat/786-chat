import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, Clock, ChefHat, Utensils, Calendar, Star, ArrowRight, Play, Volume2, VolumeX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getRestaurantBySlug, createBooking } from "@/lib/api";

const MAGIC_CLICK_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVAAAA==";

const DEFAULT_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920",
];

export default function MujeebCateringWelcome() {
  const [, setLocation] = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingGuests, setBookingGuests] = useState("2");
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants/mujeeb-catering-001"],
    queryFn: () => getRestaurantBySlug("mujeeb-catering-001"),
  });

  const bookingMutation = useMutation({
    mutationFn: (data: any) => createBooking({ ...data, restaurantId: "mujeeb-catering-001" }),
    onSuccess: () => {
      toast({ title: "Booking Submitted!", description: "We'll confirm your reservation shortly." });
      setShowBooking(false);
      setBookingName("");
      setBookingPhone("");
      setBookingDate("");
      setBookingTime("");
      setBookingGuests("2");
    },
    onError: () => {
      toast({ title: "Booking Failed", description: "Please try again.", variant: "destructive" });
    }
  });

  const handleBooking = () => {
    if (!bookingName || !bookingPhone || !bookingDate || !bookingTime) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    bookingMutation.mutate({
      customerName: bookingName,
      customerPhone: bookingPhone,
      date: bookingDate,
      time: bookingTime,
      guestCount: parseInt(bookingGuests),
    });
  };

  const heroImages = (restaurant?.welcomeSliderImages as string[] | null)?.length 
    ? (restaurant?.welcomeSliderImages as string[])
    : DEFAULT_HERO_IMAGES;

  const fullText = "Experience Royal Dining";
  const taglines = ["Central London Excellence", "Premium Catering", "Unforgettable Events"];

  const playMagicSound = () => {
    if (soundEnabled) {
      const audio = new Audio(MAGIC_CLICK_SOUND);
      audio.volume = 0.15;
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const specialDishes = [
    { name: "Lamb Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400", price: "£18.99" },
    { name: "Chicken Tikka", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400", price: "£14.99" },
    { name: "Mixed Grill", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400", price: "£24.99" },
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#1a1a2e] overflow-hidden relative"
      onClick={playMagicSound}
    >
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,140,0,0.15) 0%, transparent 50%)`,
        }}
      />

      <motion.div
        className="absolute top-10 left-10 w-32 h-32 opacity-60 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <img src="https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=200" alt="" className="w-full h-full object-cover rounded-full" />
      </motion.div>
      <motion.div
        className="absolute top-20 right-16 w-24 h-24 opacity-50 pointer-events-none"
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200" alt="" className="w-full h-full object-cover rounded-2xl" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-16 w-28 h-28 opacity-50 pointer-events-none"
        animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200" alt="" className="w-full h-full object-cover rounded-full" />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-20 w-36 h-36 opacity-40 pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200" alt="" className="w-full h-full object-cover rounded-3xl" />
      </motion.div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#1a1a2e]/95 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center shadow-lg shadow-orange-500/30 overflow-hidden">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name || "Mujeeb & Catering"} className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Mujeeb & Catering</h1>
              <p className="text-xs text-orange-400">Central London Excellence</p>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Menu", "About", "Gallery", "Book Table"].map((item, i) => (
              <motion.a
                key={item}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1, color: "#FF8C00" }}
                onClick={() => {
                  playMagicSound();
                  if (item === "Menu") setLocation("/mujeeb-catering/menu");
                }}
                className="text-white/80 hover:text-orange-400 font-medium cursor-pointer transition-colors uppercase text-sm tracking-wider"
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-full bg-white/10 hover:bg-orange-500/20 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-orange-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </motion.button>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img 
              src={heroImages[currentSlide]} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/80 via-[#1a1a2e]/60 to-[#1a1a2e]" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <span className="text-6xl">👑</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="text-white">Dine with us </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-[#FFD700]">
                {typedText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-orange-400"
                >|</motion.span>
              </span>
            </h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentSlide}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-xl md:text-2xl text-orange-300 italic mb-8"
              >
                {taglines[currentSlide]}
              </motion.p>
            </AnimatePresence>

            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
              Experience the finest Central London dining with our royal family-inspired service. 
              Premium catering for weddings, corporate events, and special occasions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => { playMagicSound(); setLocation("/mujeeb-catering/menu"); }}
                  className="px-10 py-6 text-lg bg-gradient-to-r from-[#FF8C00] to-[#FF4500] hover:from-[#FF4500] hover:to-[#FF8C00] text-white font-bold rounded-full shadow-xl shadow-orange-500/30 cursor-pointer"
                  data-testid="button-view-menu"
                >
                  <Utensils className="mr-2 h-5 w-5" />
                  View Our Menu
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={() => { playMagicSound(); setShowBooking(true); }}
                  className="px-10 py-6 text-lg border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white font-bold rounded-full cursor-pointer"
                  data-testid="button-book-table"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book My Table
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-14 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-orange-400"
            />
          </div>
        </motion.div>
      </section>

      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-[#FFD700] italic mb-4">
              Today's Special
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Discover our chef's handpicked selection of the day, prepared with the finest ingredients
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {specialDishes.map((dish, index) => (
              <motion.div
                key={dish.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-gradient-to-b from-white/10 to-transparent rounded-3xl overflow-hidden border border-white/10 hover:border-orange-400/50 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />
                </div>
                <div className="p-6 relative">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">{dish.name}</h3>
                  <p className="text-white/60 text-sm mb-4">Premium quality with authentic spices and herbs</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-400">{dish.price}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-gradient-to-r from-[#FF8C00] to-[#FF4500] text-white"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-orange-900/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 italic">Newsletter</h2>
            <p className="text-white/60 mb-8">Subscribe to get exclusive offers and updates</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-6 py-6"
              />
              <Button className="px-8 py-6 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] rounded-full font-bold">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 px-6 bg-[#0d0d1a] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">Mujeeb & Catering</h3>
            <p className="text-orange-400 text-sm">Central London Excellence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <h4 className="text-orange-400 font-bold mb-4 italic">About Us</h4>
              <p className="text-white/60 text-sm leading-relaxed">
                Premium catering services for Central London. Royal family inspired dining experience for all occasions.
              </p>
            </div>
            <div>
              <h4 className="text-orange-400 font-bold mb-4 italic">Our Menu</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Lamb Biryani</li>
                <li>Chicken Tikka</li>
                <li>Mixed Grill Platter</li>
                <li>Chef's Special</li>
              </ul>
            </div>
            <div>
              <h4 className="text-orange-400 font-bold mb-4 italic">Contact Us</h4>
              <div className="space-y-2 text-white/60 text-sm">
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  41 Hamilton Road, Ilford, IG1 2EU
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  07427 070000
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-orange-400 font-bold mb-4 italic">Opening Hours</h4>
              <div className="space-y-2 text-white/60 text-sm">
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Mon - Thu: 11AM - 10PM
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Fri - Sat: 11AM - 11PM
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-white/40 text-sm">
              © 2024 Mujeeb & Catering. All rights reserved. Powered by Mujeeb AI
            </p>
          </div>
        </div>
      </footer>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="bg-[#1a1a2e] border-orange-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-orange-400 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Book a Table
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-orange-300">Your Name</Label>
              <Input
                value={bookingName}
                onChange={(e) => setBookingName(e.target.value)}
                placeholder="Enter your name"
                className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label className="text-orange-300">Phone Number</Label>
              <Input
                value={bookingPhone}
                onChange={(e) => setBookingPhone(e.target.value)}
                placeholder="+44 7XXX XXXXXX"
                className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-orange-300">Date</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="bg-white/10 border-orange-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-orange-300">Time</Label>
                <Input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="bg-white/10 border-orange-500/30 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-orange-300">Number of Guests</Label>
              <Select value={bookingGuests} onValueChange={setBookingGuests}>
                <SelectTrigger className="bg-white/10 border-orange-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleBooking} 
              disabled={bookingMutation.isPending}
              className="w-full py-6 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] hover:from-[#FF4500] hover:to-[#FF8C00] font-bold text-lg mt-4"
            >
              <Calendar className="mr-2 h-5 w-5" />
              {bookingMutation.isPending ? "Submitting..." : "Confirm Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
