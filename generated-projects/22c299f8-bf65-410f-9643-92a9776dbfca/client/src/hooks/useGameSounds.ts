import { useCallback, useEffect, useState } from 'react';

let audioContext: AudioContext | null = null;
let isAudioEnabled = false;

// Simple audio functions that work immediately
const playStarClickSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create magical star sound with Web Audio API
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect everything
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequencies for magical star effect
    oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
    
    oscillator2.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.3);
    
    oscillator3.frequency.setValueAtTime(1100, audioContext.currentTime);
    oscillator3.frequency.exponentialRampToValueAtTime(2200, audioContext.currentTime + 0.3);

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    // Start and stop
    const startTime = audioContext.currentTime;
    const duration = 0.5;
    
    oscillator1.start(startTime);
    oscillator2.start(startTime);
    oscillator3.start(startTime);
    
    oscillator1.stop(startTime + duration);
    oscillator2.stop(startTime + duration);
    oscillator3.stop(startTime + duration);

    isAudioEnabled = true;
  } catch (error) {
    console.warn('Audio not available:', error);
  }
};

const playStarHoverSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create gentle twinkle sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency for twinkle
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.2);

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    // Start and stop
    const startTime = audioContext.currentTime;
    const duration = 0.2;
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    isAudioEnabled = true;
  } catch (error) {
    console.warn('Audio not available:', error);
  }
};

export function useGameSounds() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Enable audio on any user interaction
    const enableAudio = () => {
      if (!initialized) {
        setInitialized(true);
      }
    };

    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, [initialized]);

  const playClickSound = useCallback(() => {
    playStarClickSound();
  }, []);

  const playHoverSound = useCallback(() => {
    playStarHoverSound();
  }, []);

  return {
    playClickSound,
    playHoverSound,
    isInitialized: initialized
  };
}