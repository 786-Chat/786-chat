import { useState, useEffect, useRef } from "react";

interface PwaSplashScreenProps {
  appName: string;
  accentColor: string;
  iconComponent: React.ReactNode;
  onComplete: () => void;
}

export function PwaSplashScreen({ appName, accentColor, iconComponent, onComplete }: PwaSplashScreenProps) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem(`login-splash-${appName}`);

    if (hasSeenSplash) {
      setShow(false);
      onComplete();
      return;
    }

    sessionStorage.setItem(`login-splash-${appName}`, 'true');

    // Try to play video with sound first
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // If autoplay with sound fails, try muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
        onComplete();
      }, 500);
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, [appName, onComplete]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: '#0f172a' }}
    >
      <video
        ref={videoRef}
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        onEnded={() => {
          setFadeOut(true);
          setTimeout(() => {
            setShow(false);
            onComplete();
          }, 500);
        }}
      >
        <source src="https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427364619-5l1q7.mp4" type="video/mp4" />
      </video>
      
      <div className="relative z-10 flex flex-col items-center">
        <div 
          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center mb-6 animate-pulse"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <div style={{ color: accentColor }}>
            {iconComponent}
          </div>
        </div>
        
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-center px-4"
          style={{ color: accentColor }}
        >
          {appName}
        </h1>
        
        <div className="flex items-center gap-2 mt-4">
          <div 
            className="w-2 h-2 md:w-3 md:h-3 rounded-full animate-bounce"
            style={{ backgroundColor: accentColor, animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 md:w-3 md:h-3 rounded-full animate-bounce"
            style={{ backgroundColor: accentColor, animationDelay: '150ms' }}
          />
          <div 
            className="w-2 h-2 md:w-3 md:h-3 rounded-full animate-bounce"
            style={{ backgroundColor: accentColor, animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
