import { useSearchParams } from 'react-router-dom';
import { usePixiWorld } from '../hooks/usePixiWorld';
import { RyojiWorld } from '../../pixi/ryojiWorld/RyojiWorld';

export default function RyojiPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = usePixiWorld(RyojiWorld, { debug: debugMode }, [debugMode]);

  return (
    <div className="border-2">
      <div ref={containerRef} />
    </div>
  );
}
