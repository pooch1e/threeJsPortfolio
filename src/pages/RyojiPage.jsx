import { useSearchParams } from 'react-router-dom';
import { usePixiWorld } from '../hooks/usePixiWorld';
import { Ryoji } from '../../pixi/Ryoji';

export default function RyojiPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = usePixiWorld(Ryoji, { debug: debugMode }, [debugMode]);

  return (
    <div className="border-2">
      <div ref={containerRef} />
    </div>
  );
}
