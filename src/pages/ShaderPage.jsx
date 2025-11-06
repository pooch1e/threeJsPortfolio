import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { ShaderExperience } from '../../world/shaderTestWorld/ShaderExperience';
export default function AnimalRenderPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(ShaderExperience, { debug: debugMode }, [
    debugMode,
  ]);
  return (
    <div className="border-2">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
