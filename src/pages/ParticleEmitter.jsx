import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';

export default function ParticleEmitterPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(ParticleExperience, { debug: debugMode }, [
    debugMode,
  ]);
  return (
    <div className="border-2 cursor-none bg-[#798086]">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
