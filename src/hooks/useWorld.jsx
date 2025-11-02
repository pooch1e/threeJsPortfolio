import { useRef, useEffect } from 'react';

export function useWorld(worldClass, options = {}, dependencies = []) {
  const canvasRef = useRef(null);
  const worldRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !worldRef.current && worldClass) {
      worldRef.current = new worldClass(canvasRef.current, options);
    }

    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();
        worldRef.current = null;
      }
    };
  }, dependencies);

  return { canvasRef, worldRef };
}
