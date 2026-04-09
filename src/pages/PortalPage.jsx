import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';

export default function PortalPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(portalExperience, { debug: debugMode }, []);
  return (
    <div className="w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}