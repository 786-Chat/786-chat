import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Phone, MapPin, Clock, ChevronRight, Star, Cake, Cookie, IceCream } from "lucide-react";
import { useSubdomainSlug } from "@/App";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useMemo } from "react";

function FloatingParticles() {
  const particles = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10,
      size: 4 + Math.random() * 8,
      opacity: 0.1 + Math.random() * 0.3,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            bottom: '-20px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,200,150,0.6) 100%)`,
            animation: `floatUp ${particle.duration}s ease-in-out ${particle.delay}s infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
            transform: translateY(-10vh) scale(1);
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-110vh) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function MujeebSweetsWelcome() {
  const params = useParams<{ slug: string }>();
  const subdomainSlug = useSubdomainSlug();
  const slug = subdomainSlug || params.slug || "mujeeb-sweets";
  const [, setLocation] = useLocation();

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const handleOrderNow = () => {
    setLocation(`/${slug}/menu`);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #f5576c 100%)' }}>
      <FloatingParticles />
      
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant?.logoUrl && (
              <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
            )}
            <span className="text-xl font-bold text-white drop-shadow-lg">{restaurant?.name || 'Mujeeb Sweets'}</span>
          </div>
          <div className="flex items-center gap-4">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                <span className="text-sm hidden md:inline">{restaurant.phone}</span>
              </a>
            )}
            <Button 
              onClick={handleOrderNow}
              className="rounded-full px-6 font-semibold"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Order Now
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(10px)' }}>
              Premium Pakistani Sweets & Fresh Bakery
            </span>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
              Discover the <br />
              <span style={{ background: 'linear-gradient(90deg, #FFE259 0%, #FFA751 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sweet Life
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
              Handcrafted sweets and freshly baked goods made with love. Experience the authentic taste of Pakistan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                onClick={handleOrderNow}
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-bold shadow-2xl hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)', color: '#7c3aed' }}
              >
                Order Online <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(restaurant?.address || '')}`, '_blank')}
                className="rounded-full px-8 py-6 text-lg font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', backdropFilter: 'blur(10px)' }}
              >
                <MapPin className="mr-2 h-5 w-5" /> Find Us
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start text-white/70">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Open Daily 9AM - 10PM</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-sm ml-1">5.0</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -inset-4 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(20px)' }}></div>
              
              <div className="relative grid grid-cols-2 gap-4 p-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)' }}>
                    <Cake className="h-8 w-8 text-purple-700" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Cakes</h3>
                  <p className="text-white/60 text-sm">33+ varieties</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <IceCream className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Sweets</h3>
                  <p className="text-white/60 text-sm">39+ options</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Cookie className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Cookies</h3>
                  <p className="text-white/60 text-sm">30+ flavors</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-lg">Pastries</h3>
                  <p className="text-white/60 text-sm">9+ premium</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="relative z-10 py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{restaurant?.address || '41 Hamilton Road, Ilford, Essex, IG1 2EU'}</span>
          </div>
          <p className="text-white/50 text-xs">© 2025 {restaurant?.name || 'Mujeeb Sweets & Bakers'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
