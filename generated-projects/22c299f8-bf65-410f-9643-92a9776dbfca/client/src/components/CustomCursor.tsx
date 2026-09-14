import { useState, useEffect } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [magicColors, setMagicColors] = useState({ primary: 'purple', secondary: 'pink' });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsClicking(true);
      
      // Play magical chime sound
      playMagicalSound();
      
      // Change colors on click for magical effect
      const colors = [
        { primary: 'purple', secondary: 'pink' },
        { primary: 'blue', secondary: 'cyan' },
        { primary: 'emerald', secondary: 'teal' },
        { primary: 'violet', secondary: 'fuchsia' },
        { primary: 'indigo', secondary: 'purple' },
      ];
      setMagicColors(colors[Math.floor(Math.random() * colors.length)]);
    };

    const playMagicalSound = () => {
      try {
        // Create audio context for magical chime sounds
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create magical chime with multiple frequencies
        const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(randomFreq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Create magical fade effect
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        // Fallback for browsers that don't support Web Audio API
        console.log('Audio not supported');
      }
    };

    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, [role="button"], .cursor-pointer');
      setIsHovering(!!isInteractive);
    };

    // Color cycling animation
    const colorInterval = setInterval(() => {
      if (!isClicking) {
        const colors = [
          { primary: 'red', secondary: 'orange' },
          { primary: 'orange', secondary: 'yellow' },
          { primary: 'yellow', secondary: 'green' },
          { primary: 'green', secondary: 'blue' },
          { primary: 'blue', secondary: 'indigo' },
          { primary: 'indigo', secondary: 'purple' },
          { primary: 'purple', secondary: 'pink' },
          { primary: 'pink', secondary: 'red' },
          { primary: 'cyan', secondary: 'teal' },
          { primary: 'emerald', secondary: 'lime' },
          { primary: 'rose', secondary: 'fuchsia' },
          { primary: 'violet', secondary: 'sky' },
        ];
        setMagicColors(colors[Math.floor(Math.random() * colors.length)]);
      }
    }, 2000);

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      clearInterval(colorInterval);
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isClicking]);

  return (
    <>
      {/* Hide default cursor globally with stronger CSS */}
      <style>{`
        *, *::before, *::after {
          cursor: none !important;
        }
        body, html {
          cursor: none !important;
        }
        input, textarea, button, a, [role="button"] {
          cursor: none !important;
        }
        
        @keyframes magicalPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.8), 0 0 50px rgba(34, 197, 94, 0.6), 0 0 75px rgba(52, 211, 153, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 35px rgba(16, 185, 129, 1), 0 0 70px rgba(34, 197, 94, 0.8), 0 0 105px rgba(52, 211, 153, 0.6);
          }
        }
        
        @keyframes sparkleRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      
      {/* Custom cursor - Enhanced with bigger size and continuous pulse */}
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-150 ${
          isClicking ? 'scale-150' : isHovering ? 'scale-175' : 'scale-125'
        }`}
        style={{
          transform: `translate3d(${position.x - 24}px, ${position.y - 24}px, 0)`,
        }}
      >
        {/* Main cursor circle with continuous magical pulse */}
        <div
          className={`w-12 h-12 rounded-full border-3 transition-all duration-300 animate-pulse ${
            isHovering
              ? 'bg-emerald-500/60 border-emerald-300 shadow-2xl shadow-emerald-400/90'
              : 'bg-emerald-500/40 border-emerald-400/80 backdrop-blur-sm'
          } ${isClicking ? 'bg-emerald-400/80 border-emerald-200 shadow-3xl shadow-emerald-400/100 scale-200' : ''}`}
          style={{
            background: isClicking 
              ? `radial-gradient(circle, #10b981, #22c55e, #34d399, #6ee7b7)`
              : isHovering
              ? `radial-gradient(circle, #10b981 0%, #22c55e 40%, #34d399 80%, #6ee7b7 100%)`
              : `radial-gradient(circle, rgba(16, 185, 129, 0.6), rgba(34, 197, 94, 0.4), rgba(52, 211, 153, 0.3))`,
            boxShadow: isClicking 
              ? `0 0 50px #10b981, 0 0 100px #22c55e, 0 0 150px #34d399, 0 0 200px #6ee7b7`
              : isHovering
              ? `0 0 40px #10b981, 0 0 80px #22c55e, 0 0 120px #34d399`
              : `0 0 25px rgba(16, 185, 129, 0.8), 0 0 50px rgba(34, 197, 94, 0.6), 0 0 75px rgba(52, 211, 153, 0.4)`,
            animation: 'magicalPulse 2s ease-in-out infinite'
          }}
        >
          {/* Enhanced inner glowing dot */}
          <div
            className={`w-4 h-4 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isHovering
                ? 'bg-emerald-200'
                : 'bg-white/90'
            } ${isClicking ? 'bg-emerald-100 scale-300' : ''}`}
            style={{
              background: isClicking 
                ? `radial-gradient(circle, #f0fdf4, #dcfce7, #bbf7d0)`
                : isHovering
                ? `radial-gradient(circle, #dcfce7, #bbf7d0)`
                : 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
              boxShadow: isClicking 
                ? `0 0 20px #10b981, 0 0 40px #22c55e`
                : isHovering
                ? `0 0 10px #10b981`
                : `0 0 5px rgba(255,255,255,0.6)`
            }}
          />
          
          {/* Enhanced outer ring for hover effect */}
          {isHovering && (
            <>
              <div 
                className="absolute inset-0 rounded-full border-2 animate-ping"
                style={{
                  borderColor: '#10b981',
                  animationDuration: '1s'
                }}
              />
              <div 
                className="absolute -inset-2 rounded-full border-2 animate-ping opacity-50"
                style={{
                  borderColor: '#22c55e',
                  animationDuration: '1.5s'
                }}
              />
            </>
          )}
        </div>
        
        {/* Enhanced magical particle burst with 18 particles */}
        {isClicking && (
          <>
            {/* Inner ring particles */}
            <div className="absolute -top-8 -left-8 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute -top-8 -right-8 w-4 h-4 bg-green-400 rounded-full animate-ping delay-75" />
            <div className="absolute -bottom-8 -left-8 w-4 h-4 bg-emerald-500 rounded-full animate-ping delay-150" />
            <div className="absolute -bottom-8 -right-8 w-4 h-4 bg-green-500 rounded-full animate-ping delay-200" />
            <div className="absolute top-0 -left-10 w-3 h-3 bg-emerald-300 rounded-full animate-ping delay-100" />
            <div className="absolute top-0 -right-10 w-3 h-3 bg-green-300 rounded-full animate-ping delay-300" />
            
            {/* Middle ring particles */}
            <div className="absolute -top-12 left-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping delay-50" />
            <div className="absolute -bottom-12 left-0 w-3 h-3 bg-green-400 rounded-full animate-ping delay-250" />
            <div className="absolute top-0 -left-14 w-2 h-2 bg-emerald-500 rounded-full animate-ping delay-125" />
            <div className="absolute top-0 -right-14 w-2 h-2 bg-green-500 rounded-full animate-ping delay-275" />
            <div className="absolute -top-10 -left-4 w-2 h-2 bg-emerald-300 rounded-full animate-ping delay-175" />
            <div className="absolute -top-10 -right-4 w-2 h-2 bg-green-300 rounded-full animate-ping delay-325" />
            
            {/* Outer ring particles */}
            <div className="absolute -top-16 -left-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-225" />
            <div className="absolute -bottom-16 -right-2 w-2 h-2 bg-green-400 rounded-full animate-ping delay-350" />
            <div className="absolute -top-14 -right-6 w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-400" />
            <div className="absolute -bottom-14 -left-6 w-1 h-1 bg-green-500 rounded-full animate-ping delay-450" />
            <div className="absolute -top-6 -left-12 w-1 h-1 bg-emerald-300 rounded-full animate-ping delay-500" />
            <div className="absolute -bottom-6 -right-12 w-1 h-1 bg-green-300 rounded-full animate-ping delay-550" />
          </>
        )}
      </div>
    </>
  );
}