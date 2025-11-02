import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { World } from '../../world/World';
export default function AnimalRenderPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(World, { debug: debugMode }, [debugMode]);
  return (
    <div>
      return (<canvas ref={canvasRef}></canvas>
      );
    </div>
  );
}
