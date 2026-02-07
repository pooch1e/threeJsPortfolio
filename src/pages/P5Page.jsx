import { useSearchParams } from 'react-router-dom';
import { useP5World } from '../hooks/useP5World';
import { Ryoji } from '../p5/Ryoji';

export default function RyojiPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = useP5World(Ryoji, { debug: debugMode }, [debugMode]);

  return (
    <div className="border-2">
      <div ref={containerRef}></div>
    </div>
  );
}
