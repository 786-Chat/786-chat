import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import type { HeroImage } from "@shared/schema";

type AnimationEffect = "slide" | "fade" | "scrapbook" | "stomp" | "flicker" | "pulse" | "tectonic";

interface HeroCarouselProps {
  images: HeroImage[];
  effect?: AnimationEffect;
  interval?: number;
  className?: string;
  fallbackImage?: string;
  gradientStart?: string;
  gradientMiddle?: string;
  gradientEnd?: string;
}

const getAnimationVariants = (effect: AnimationEffect): Variants => {
  switch (effect) {
    case "slide":
      return {
        initial: { x: "100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-100%", opacity: 0 },
      };
    case "fade":
      return {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };
    case "scrapbook":
      return {
        initial: { 
          opacity: 0, 
          rotate: -10, 
          scale: 0.8,
          y: 50,
        },
        animate: { 
          opacity: 1, 
          rotate: 0, 
          scale: 1,
          y: 0,
        },
        exit: { 
          opacity: 0, 
          rotate: 10, 
          scale: 0.8,
          y: -50,
        },
      };
    case "stomp":
      return {
        initial: { 
          opacity: 0, 
          scale: 1.5,
          y: -100,
        },
        animate: { 
          opacity: 1, 
          scale: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
          }
        },
        exit: { 
          opacity: 0, 
          scale: 0.5,
          y: 100,
        },
      };
    case "flicker":
      return {
        initial: { opacity: 0 },
        animate: { 
          opacity: [0, 1, 0.8, 1, 0.9, 1],
          transition: {
            duration: 0.5,
            times: [0, 0.1, 0.2, 0.4, 0.6, 1],
          }
        },
        exit: { 
          opacity: [1, 0.5, 1, 0],
          transition: {
            duration: 0.3,
          }
        },
      };
    case "pulse":
      return {
        initial: { opacity: 0, scale: 0.9 },
        animate: { 
          opacity: 1, 
          scale: 1.02,
        },
        exit: { opacity: 0, scale: 1.1 },
      };
    case "tectonic":
      return {
        initial: { 
          opacity: 0,
          x: -20,
        },
        animate: { 
          opacity: 1,
          x: 0,
        },
        exit: { 
          opacity: 0,
          x: 20,
        },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

const getTransition = (effect: AnimationEffect): Transition => {
  switch (effect) {
    case "slide":
      return { duration: 0.6, ease: [0.4, 0, 0.2, 1] };
    case "fade":
      return { duration: 0.8, ease: [0.4, 0, 0.2, 1] };
    case "scrapbook":
      return { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] };
    case "stomp":
      return { type: "spring", stiffness: 300, damping: 25 };
    case "flicker":
      return { duration: 0.5 };
    case "pulse":
      return { duration: 0.6, ease: [0, 0, 0.2, 1] };
    case "tectonic":
      return { duration: 0.4, ease: [0, 0, 0.2, 1] };
    default:
      return { duration: 0.5 };
  }
};

export function HeroCarousel({
  images,
  effect = "slide",
  interval = 5000,
  className = "",
  fallbackImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
  gradientStart = "#dc2626",
  gradientMiddle = "#f97316",
  gradientEnd = "#fbbf24",
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeImages = images.filter(img => img.isActive !== false);

  useEffect(() => {
    if (activeImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [activeImages.length, interval]);

  if (activeImages.length === 0) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img
          src={fallbackImage}
          alt="Restaurant"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (activeImages.length === 1) {
    const item = activeImages[0];
    const isVideo = item.mediaType === 'video' || item.imageUrl?.endsWith('.mp4');
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        {isVideo ? (
          <video
            src={item.imageUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={item.imageUrl}
            alt={item.label || "Restaurant"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
        )}
      </div>
    );
  }

  const variants = getAnimationVariants(effect);
  const transition = getTransition(effect);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientMiddle} 50%, ${gradientEnd} 100%)`
        }}
      />
      
      <AnimatePresence mode="wait">
        {(() => {
          const currentItem = activeImages[currentIndex];
          const isVideo = currentItem.mediaType === 'video' || currentItem.imageUrl?.endsWith('.mp4');
          
          if (isVideo) {
            return (
              <motion.video
                key={currentIndex}
                src={currentItem.imageUrl}
                className="absolute inset-0 w-full h-full object-cover z-[1]"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                autoPlay
                loop
                muted
                playsInline
                poster={fallbackImage}
                onError={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.style.display = 'none';
                }}
                data-testid={`hero-slide-${currentIndex}`}
              />
            );
          }
          
          return (
            <motion.img
              key={currentIndex}
              src={currentItem.imageUrl}
              alt={currentItem.label || `Slide ${currentIndex + 1}`}
              className="absolute inset-0 w-full h-full object-cover z-[1]"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
              data-testid={`hero-slide-${currentIndex}`}
            />
          );
        })()}
      </AnimatePresence>

      {activeImages.length > 1 && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          data-testid="hero-carousel-dots"
        >
          {activeImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`hero-carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
