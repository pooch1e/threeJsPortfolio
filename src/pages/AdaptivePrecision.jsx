import { useSearchParams } from 'react-router-dom';
import { useP5World } from '../hooks/useP5World';
import { AdaptivePrecision } from '../p5/AdaptivePrecision'

export default function AdaptivePrecisionPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = useP5World(AdaptivePrecision, { debug: debugMode }, [debugMode]);

  return (
    <div className="border-2 cursor-none">
      <div ref={containerRef}></div>
    </div>
  );
}
