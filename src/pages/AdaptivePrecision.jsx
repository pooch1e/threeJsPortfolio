import { useSearchParams } from 'react-router-dom';
import { usePixiWorld } from '../hooks/usePixiWorld';
import { AdaptivePrecision } from '../../pixi/AdaptivePrecision';

export default function AdaptivePrecisionPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = usePixiWorld(AdaptivePrecision, { debug: debugMode }, [debugMode]);

  return (
    <div className="border-2 cursor-none">
      <div ref={containerRef} />
    </div>
  );
}
