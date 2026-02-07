import { useEffect, useRef } from 'react';
import { Setup } from '../p5/Setup';

export function useP5World(WorldClass, options = {}, dependencies = []) {
  const containerRef = useRef(null);
  const setupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create new p5 world
    setupRef.current = new Setup(
      WorldClass,
      options.canvasWidth || window.innerWidth,
      options.canvasHeight || window.innerHeight,
      containerRef.current,
    );

    // Cleanup on unmount
    return () => {
      if (setupRef.current) {
        setupRef.current.dispose();
        setupRef.current = null;
      }
    };
  }, dependencies);

  return { containerRef, setupInstance: setupRef.current };
}
