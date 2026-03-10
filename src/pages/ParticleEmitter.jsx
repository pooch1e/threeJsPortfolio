import { useSearchParams } from 'react-router-dom';
import { usePixiWorld } from '../hooks/usePixiWorld';

import { ParticleEmitterWorld } from '../../pixi/particleEmitter/ParticleEmitterWorld';


export default function ParticleEmitterPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { containerRef } = usePixiWorld(ParticleEmitterWorld, { debug: debugMode }, [
    debugMode,
  ]);
  return (
    <div className="border-2 cursor-none bg-[#798086]">
      <div ref={containerRef}></div>
    </div>
  );
}
