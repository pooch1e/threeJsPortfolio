import { useEffect, useRef } from 'react';
import { Setup } from '../p5/Setup';

export function useP5World(WorldClass, options = {}, dependencies = []) {
  const containerRef = useRef(null);
  const setupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setupRef.current = new Setup(WorldClass, containerRef.current);

    return () => {
      if (setupRef.current) {
        setupRef.current.dispose();
        setupRef.current = null;
      }
    };
  }, dependencies);

  return { containerRef, setupInstance: setupRef.current };
}
