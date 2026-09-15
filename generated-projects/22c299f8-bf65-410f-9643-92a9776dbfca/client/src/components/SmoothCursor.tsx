import { useState, useEffect, useRef } from 'react';

interface SmoothCursorProps {
  enabled?: boolean;
}

export default function SmoothCursor({ enabled = true }: SmoothCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Audio context not supported');
      }
    }
  }, [enabled]);

  // Play classic click sound
  const playClickSound = () => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.log('Error playing sound');
    }
  };

  // Play hover sound
  const playHoverSound = () => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.05);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.05);
    } catch (error) {
      console.log('Error playing hover sound');
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsClicking(true);
      playClickSound();
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a'))) {
        setIsHovering(true);
        playHoverSound();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a'))) {
        setIsHovering(false);
      }
    };

    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', updateCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.body.style.cursor = 'auto';
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[9999] mix-blend-difference"
      style={{
        left: position.x - 12,
        top: position.y - 12,
        transition: 'none', // Remove transition for zero delay
      }}
    >
      <div
        className={`
          w-6 h-6 rounded-full border-2 border-white
          ${isClicking ? 'scale-75 bg-white/20' : 'scale-100'}
          ${isHovering ? 'scale-150 border-purple-400' : ''}
          transition-transform duration-100 ease-out
          shadow-lg shadow-white/20
        `}
        style={{
          background: isHovering 
            ? 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)'
            : isClicking 
            ? 'rgba(255, 255, 255, 0.4)'
            : 'transparent'
        }}
      >
        {/* Inner dot */}
        <div 
          className={`
            w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            ${isClicking ? 'scale-150' : 'scale-100'}
            transition-transform duration-100
          `}
        />
      </div>
    </div>
  );
}