import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { PointExperience } from '../../world/pointCloudWorld/PointExperience';
export default function PointCloudPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(PointExperience, { debug: debugMode }, [
    debugMode,
  ]);
  return (
    <div className="border-2  bg-[#798086]">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
