import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { SineExperience } from '../../world/sineWorld/SineExperience';
export default function SineWavePage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(SineExperience, { debug: debugMode }, [
    debugMode,
  ]);
  return (
    <div className="border-2">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
