import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Phone, MapPin, Clock, ChevronRight, Utensils, Star, Loader2, Calendar, X } from "lucide-react";
import { useSubdomainSlug } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { createBooking, getPopularItems } from "@/lib/api";
import type { PopularItem } from "@shared/schema";

interface HeroImage {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

const HELLO_MUMBAI_HERO_IMAGES: HeroImage[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200",
    title: "Authentic Indian Cuisine",
    subtitle: "Traditional recipes with modern flair"
  },
  {
    id: "2", 
    imageUrl: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200",
    title: "Indo Chinese Specialties",
    subtitle: "Where East meets West"
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200",
    title: "Fresh & Flavorful",
    subtitle: "Made with love in Wembley"
  }
];

function GoldenParticles() {
  const particles = useMemo(() => 
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 6 + Math.random() * 8,
      size: 1 + Math.random() * 3,
      opacity: 0.2 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 100
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.left}%`,
            top: '-20px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 3}px rgba(255, 215, 0, 0.8), 0 0 ${particle.size * 6}px rgba(255, 165, 0, 0.4)`,
            animation: `goldenFall ${particle.duration}s linear ${particle.delay}s infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes goldenFall {
          0% {
            transform: translateY(-20px) translateX(0px) rotate(0deg) scale(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
            transform: translateY(5vh) translateX(10px) rotate(45deg) scale(1);
          }
          50% {
            opacity: 0.8;
          }
          95% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(105vh) translateX(-20px) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function NawabBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0000 0%, #1a0505 20%, #200808 40%, #150303 60%, #0a0000 80%, #000000 100%)',
          backgroundSize: '100% 200%',
          animation: 'nawabGradient 20s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(255, 215, 0, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 85% 20%, rgba(255, 165, 0, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 50% 80%, rgba(255, 140, 0, 0.12) 0%, transparent 35%),
            radial-gradient(circle at 20% 70%, rgba(255, 200, 0, 0.08) 0%, transparent 20%),
            radial-gradient(circle at 80% 75%, rgba(255, 180, 0, 0.1) 0%, transparent 25%)
          `,
          animation: 'glowPulse 8s ease-in-out infinite alternate'
        }}
      />
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23FFD700' fill-opacity='0.1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}
      />
      <style>{`
        @keyframes nawabGradient {
          0%, 100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 0% 100%;
          }
        }
        @keyframes glowPulse {
          0% {
            opacity: 0.15;
            transform: scale(1);
          }
          100% {
            opacity: 0.25;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

function CustomBackground({ restaurant }: { restaurant: any }) {
  const bgType = restaurant?.welcomeBackgroundType || 'gradient';
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderImages = restaurant?.welcomeSliderImages || [];
  
  useEffect(() => {
    if (bgType === 'slider' && sliderImages.length > 1) {
      const interval = setInterval(() => {
        setSliderIndex((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bgType, sliderImages.length]);
  
  if (bgType === 'gradient' || !bgType) {
    return <NawabBackground />;
  }
  
  if (bgType === 'image' && restaurant?.welcomeBackgroundImageUrl) {
    return (
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${restaurant.welcomeBackgroundImageUrl})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
    );
  }
  
  if (bgType === 'gif' && restaurant?.welcomeBackgroundGifUrl) {
    return (
      <div className="absolute inset-0 z-0">
        <img 
          src={restaurant.welcomeBackgroundGifUrl} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
    );
  }
  
  if (bgType === 'video' && restaurant?.welcomeBackgroundVideoUrl) {
    return (
      <div className="absolute inset-0 z-0">
        <video 
          src={restaurant.welcomeBackgroundVideoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
    );
  }
  
  if (bgType === 'slider' && sliderImages.length > 0) {
    return (
      <div className="absolute inset-0 z-0">
        {sliderImages.map((url: string, index: number) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{ 
              backgroundImage: `url(${url})`,
              opacity: index === sliderIndex ? 1 : 0
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/50" />
      </div>
    );
  }
  
  return <NawabBackground />;
}

function HeroSlider({ images }: { images: HeroImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-5">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="absolute inset-0 transition-all duration-2000"
          style={{ 
            opacity: index === currentIndex ? 0.25 : 0,
            backgroundImage: `url(${image.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(30%) saturate(120%)',
            transform: index === currentIndex ? 'scale(1.05)' : 'scale(1)'
          }}
        />
      ))}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-500 ${
              index === currentIndex 
                ? 'w-8 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg' 
                : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/50'
            }`}
            data-testid={`slider-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

function GoldenDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/50 to-yellow-500" />
      <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent via-yellow-500/50 to-yellow-500" />
    </div>
  );
}

export default function HelloMumbaiWelcome() {
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "hello-mumbai";
  const { toast } = useToast();

  // Booking card state
  const [showBookingCard, setShowBookingCard] = useState(false);
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
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

  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => createBooking(bookingData),
  });

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
  });

  const { data: heroImages = [] } = useQuery({
    queryKey: ["/api/hero-images", restaurant?.id],
    queryFn: async () => {
      const res = await fetch(`/api/hero-images/${restaurant.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  const { data: featuredItems = [] } = useQuery<PopularItem[]>({
    queryKey: ["/api/popular-items", restaurant?.id],
    queryFn: () => getPopularItems(restaurant!.id),
    enabled: !!restaurant?.id,
  });

  const displayImages = heroImages.length > 0 ? heroImages : HELLO_MUMBAI_HERO_IMAGES;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#000000' }}>
      <CustomBackground restaurant={restaurant} />
      <HeroSlider images={displayImages} />
      <GoldenParticles />

      <div className="relative z-20 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center"
          >
            <div className="relative inline-block">
              <div 
                className="absolute -inset-4 rounded-full opacity-30 blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(255,165,0,0.4) 0%, transparent 70%)' }}
              />
              {restaurant?.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant?.name || "Restaurant"} 
                  className="relative h-44 md:h-64 mx-auto object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(255, 165, 0, 0.3))' }}
                />
              ) : (
                <img 
                  src="/attached_assets/heloo_gif_1768064430944.gif" 
                  alt={restaurant?.name || "Restaurant"} 
                  className="relative h-44 md:h-64 mx-auto object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(255, 165, 0, 0.3))' }}
                />
              )}
            </div>
          </motion.div>

          <GoldenDivider />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 
              className="text-xl md:text-2xl font-light tracking-[0.3em] uppercase mb-2"
              style={{ 
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255, 165, 0, 0.3)'
              }}
            >
              {restaurant?.cuisineType || "Indian & Indo-Chinese"}
            </h2>
            <p className="text-white/50 text-sm md:text-base leading-relaxed px-6 italic">
              "{restaurant?.tagline || "Authentic Indian Flavours, Straight from Mumbai"}"
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 mt-10 mb-12"
          >
            <Button
              onClick={() => navigate(`/r/${slug}/menu`)}
              className="group px-10 py-7 text-lg font-semibold rounded-none shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-transparent hover:border-yellow-500/50"
              style={{ 
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                color: '#000000'
              }}
              data-testid="button-view-menu"
            >
              <Utensils className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
              Explore Our Menu
              <ChevronRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={() => setShowBookingCard(!showBookingCard)}
              variant="outline"
              className="group px-10 py-7 text-lg font-semibold rounded-none border-2 transition-all duration-500 hover:scale-105"
              style={{
                borderColor: 'rgba(255, 215, 0, 0.5)',
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.05)'
              }}
              data-testid="button-book-table"
            >
              <Calendar className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
              {showBookingCard ? "Hide Booking" : "Book a Table"}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 w-full"
          >
            <div 
              className="relative overflow-hidden p-8 text-center transition-all duration-500 hover:scale-105 group"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 5, 5, 0.9) 0%, rgba(40, 10, 10, 0.8) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <MapPin className="h-10 w-10 mx-auto mb-4 transition-transform group-hover:scale-110" style={{ color: '#FFD700' }} />
              <h3 className="text-white font-semibold text-lg mb-2 tracking-wide">Location</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {restaurant?.address || "Address not set"}
              </p>
            </div>
            
            <div 
              className="relative overflow-hidden p-8 text-center transition-all duration-500 hover:scale-105 group"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 5, 5, 0.9) 0%, rgba(40, 10, 10, 0.8) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <Phone className="h-10 w-10 mx-auto mb-4 transition-transform group-hover:scale-110" style={{ color: '#FFD700' }} />
              <h3 className="text-white font-semibold text-lg mb-2 tracking-wide">Call Us</h3>
              <p className="text-white/50 text-sm">
                {restaurant?.phone || "Phone not set"}
              </p>
            </div>
            
            <div 
              className="relative overflow-hidden p-8 text-center transition-all duration-500 hover:scale-105 group"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 5, 5, 0.9) 0%, rgba(40, 10, 10, 0.8) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <Clock className="h-10 w-10 mx-auto mb-4 transition-transform group-hover:scale-110" style={{ color: '#FFD700' }} />
              <h3 className="text-white font-semibold text-lg mb-2 tracking-wide">Open Hours</h3>
              <p className="text-white/50 text-sm">
                Mon-Sun: 12pm - 11pm
              </p>
            </div>
          </motion.div>

          {/* Featured Items Section */}
          {featuredItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-12 max-w-4xl mx-auto px-4 w-full"
            >
              <h3 
                className="text-center text-xl md:text-2xl font-light tracking-[0.2em] uppercase mb-8"
                style={{ 
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Featured Dishes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredItems.filter(item => item.isActive).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                    onClick={() => item.linkUrl && navigate(item.linkUrl)}
                    className={`relative group cursor-pointer overflow-hidden rounded-lg aspect-square ${item.linkUrl ? 'hover:scale-105' : ''}`}
                    style={{
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
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
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ 
                        border: '2px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: 'inherit'
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Small Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-10 max-w-2xl mx-auto px-4 w-full"
          >
            <div 
              className="relative overflow-hidden rounded-lg"
              style={{
                border: '2px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              {restaurant?.googleMapsUrl ? (
                <iframe
                  src={restaurant.googleMapsUrl.includes('embed') ? restaurant.googleMapsUrl : `https://www.google.com/maps?q=${encodeURIComponent(restaurant.address || '')}&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0, filter: 'grayscale(80%) contrast(1.1)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${restaurant?.name || "Restaurant"} Location`}
                />
              ) : (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(restaurant?.address || '')}&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0, filter: 'grayscale(80%) contrast(1.1)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${restaurant?.name || "Restaurant"} Location`}
                />
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ 
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }} />
            </div>
            <p className="text-center text-yellow-500/60 text-xs mt-3 tracking-wider">
              FIND US AT {restaurant?.address?.toUpperCase() || "OUR LOCATION"}
            </p>
          </motion.div>
        </div>

        <footer className="py-8 text-center" style={{ borderTop: '1px solid rgba(255, 215, 0, 0.1)' }}>
          <p className="text-white/30 text-sm tracking-wider">
            © {new Date().getFullYear()} {restaurant?.name || "Restaurant"}. All rights reserved.
          </p>
          <div className="mt-3 flex justify-center gap-4">
            <a 
              href="/terms" 
              className="text-yellow-600/50 text-xs hover:text-yellow-500 transition-colors tracking-wider"
            >
              Terms & Conditions
            </a>
            <span className="text-white/20">|</span>
            <a 
              href="/terms" 
              className="text-yellow-600/50 text-xs hover:text-yellow-500 transition-colors tracking-wider"
            >
              Privacy Policy
            </a>
          </div>
        </footer>
      </div>

      {/* Floating Booking Card */}
      <AnimatePresence>
        {showBookingCard && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed right-6 bottom-6 z-50 w-80 max-h-[85vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.98) 0%, rgba(15, 10, 5, 0.98) 100%)',
              border: '1px solid rgba(255,215,0,0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {bookingSubmitted ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Booking Received!</h3>
                <p className="text-white/70 text-sm mb-4">
                  Your booking request has been submitted. Please wait for the manager to confirm your reservation via WhatsApp.
                </p>
                <div className="p-3 rounded-lg bg-black/50 border border-yellow-500/20 mb-4">
                  <p className="text-white/60 text-xs mb-1">You will receive confirmation at:</p>
                  <p className="text-white font-medium">{bookingCountryCode} {bookingPhone}</p>
                </div>
                <Button
                  onClick={() => {
                    setBookingSubmitted(false);
                    setShowBookingCard(false);
                  }}
                  variant="outline"
                  className="w-full border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-yellow-400">Book a Table</h3>
                  <button 
                    onClick={() => setShowBookingCard(false)}
                    className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-yellow-300 hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-yellow-200 mb-1">Date</label>
                      <Popover open={bookingCalendarOpen} onOpenChange={setBookingCalendarOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 px-3 text-sm bg-black/50 border border-yellow-500/30 rounded-md flex items-center gap-2 text-left hover:bg-black/70 transition-colors"
                          >
                            <Calendar className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                            <span className={bookingDate ? "text-white" : "text-white/50"}>
                              {bookingDate ? format(new Date(bookingDate), "dd/MM/yyyy") : "Select"}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-900 border-yellow-500/30" align="start">
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
                      <label className="block text-xs font-medium text-yellow-200 mb-1">Time</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full h-10 px-2 text-sm border rounded-md bg-black/50 border-yellow-500/30 text-white"
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
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-yellow-500/20">
                      <span className="text-sm text-white">Adults</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAdults(Math.max(0, adults - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{adults}</span>
                        <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-yellow-500/20">
                      <span className="text-sm text-white">Children <span className="text-xs text-white/50">(2-12)</span></span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{children}</span>
                        <button onClick={() => setChildren(children + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-yellow-500/20">
                      <span className="text-sm text-white">Infants <span className="text-xs text-white/50">(0-2)</span></span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setInfants(Math.max(0, infants - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                        <span className="w-6 text-center text-white font-bold">{infants}</span>
                        <button onClick={() => setInfants(infants + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-200 mb-1">Name *</label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="h-10 text-sm bg-black/50 border-yellow-500/30 text-white placeholder:text-white/50"
                      data-testid="input-booking-name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-200 mb-1">Phone * (WhatsApp)</label>
                    <div className="flex gap-2">
                      <select
                        value={bookingCountryCode}
                        onChange={(e) => setBookingCountryCode(e.target.value)}
                        className="w-24 h-10 px-2 text-sm border rounded-md bg-black/50 border-yellow-500/30 text-white"
                        data-testid="select-country-code"
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
                        className="flex-1 h-10 text-sm bg-black/50 border-yellow-500/30 text-white placeholder:text-white/50"
                        data-testid="input-booking-phone"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-200 mb-1">Email</label>
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      className="h-10 text-sm bg-black/50 border-yellow-500/30 text-white placeholder:text-white/50"
                      data-testid="input-booking-email"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-200 mb-1">♿ Special Assistance / Accessibility Needs</label>
                    <textarea
                      placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                      value={bookingSpecialRequests}
                      onChange={(e) => setBookingSpecialRequests(e.target.value)}
                      className="w-full h-16 px-3 py-2 text-sm border rounded-md bg-black/50 border-yellow-500/30 text-white placeholder:text-white/50 resize-none"
                      data-testid="input-special-requests"
                    />
                  </div>

                  <Button
                    onClick={async () => {
                      if (!bookingDate || !bookingTime || !bookingName || !bookingPhone) {
                        toast({ title: "Please fill in all required fields", variant: "destructive" });
                        return;
                      }
                      if (!restaurant?.id) {
                        toast({ title: "Restaurant not found", variant: "destructive" });
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
                    className="w-full h-12 text-base font-bold rounded-xl text-black"
                    style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)' }}
                    disabled={createBookingMutation.isPending}
                    data-testid="button-confirm-booking"
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
    </div>
  );
}
