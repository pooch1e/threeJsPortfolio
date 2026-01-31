import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { ShaderExperience } from '../../world/shaderTestWorld/ShaderExperience';
import ShaderSwitchListButton from '../components/ShaderSwitchListButton';
import LoadingBar from '../components/LoadingBar';
import { useState, useEffect, useRef } from 'react';
export default function ShaderPage() {
  const [shaderChoice, setShaderChoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const canvas2dRef = useRef(null);

  const debugMode = searchParams.get('debug') !== 'false';

  // Set default debug=true on initial load
  useEffect(() => {
    if (!searchParams.has('debug')) {
      setSearchParams({ debug: 'true' });
    }
  }, []);

  const { canvasRef, worldRef } = useWorld(
    ShaderExperience,
    { debug: debugMode },
    [debugMode]
  );

  // Subscribe to loading events from World
  useEffect(() => {
    const world = worldRef.current?.world;
    if (!world) return;

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadComplete = () => {
      setIsLoading(false);
    };

    world.on('loadstart', handleLoadStart);
    world.on('loadcomplete', handleLoadComplete);

    return () => {
      world.off('loadstart');
      world.off('loadcomplete');
    };
  }, [worldRef]);

  useEffect(() => {
    if (shaderChoice && worldRef.current?.world) {
      worldRef.current.world.loadPractice(shaderChoice, canvas2dRef.current);
    }
  }, [shaderChoice, worldRef]);

  return (
    <div className=" bg-[#798086]">
      <LoadingBar isLoading={isLoading} />
      <ShaderSwitchListButton setShaderChoice={setShaderChoice} />
      <canvas ref={canvasRef}></canvas>
      {shaderChoice === 'particlesAnimationShader' && (
        // handle 2d canvas
        <canvas
          ref={canvas2dRef}
          className="fixed w-[256px] h-[256px] top-14 left-0 z-10 pointer-events-none"></canvas>
      )}
    </div>
  );
}
