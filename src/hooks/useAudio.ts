import { useCallback } from 'react';

export function useAudio() {
  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'game-end') => {
    const urls = {
      move: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      capture: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      check: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
      'game-end': 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
    };
    
    try {
      const audio = new Audio(urls[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {}); // catch autoplay blocking
    } catch (e) {
      // ignore
    }
  }, []);

  return { playSound };
}
