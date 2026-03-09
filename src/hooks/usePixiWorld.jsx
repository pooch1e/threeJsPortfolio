import { useRef, useEffect } from 'react';
import { Setup } from '../../pixi/Setup';

export function usePixiWorld(WorldClass, options = {}, dependencies = []) {
  const containerRef = useRef(null);
  const setupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !WorldClass) return;

    const setup = new Setup(WorldClass, containerRef.current, options);
    setupRef.current = setup;

    setup.init().catch(console.error);

    return () => {
      setupRef.current?.destroy();
      setupRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WorldClass, ...dependencies]);

  return { containerRef };
}
