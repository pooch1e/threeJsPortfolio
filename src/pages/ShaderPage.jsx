import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { ShaderExperience } from '../../world/shaderTestWorld/ShaderExperience';
import ShaderSwitchListButton from '../components/ShaderSwitchListButton';
import { useState, useEffect, useRef } from 'react';
export default function AnimalRenderPage() {
  const [shaderChoice, setShaderChoice] = useState(null);
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';
  const canvas2dRef = useRef(null);

  const { canvasRef, worldRef } = useWorld(
    ShaderExperience,
    { debug: debugMode },
    [debugMode]
  );

  useEffect(() => {
    if (shaderChoice && worldRef.current?.world) {
      worldRef.current.world.loadPractice(shaderChoice, canvas2dRef.current);
    }
  }, [shaderChoice]);

  return (
    <div className=" bg-[#798086]">
      <ShaderSwitchListButton setShaderChoice={setShaderChoice} />
      <canvas ref={canvasRef}></canvas>
      {shaderChoice === 'particlesAnimationShader' && (
        <canvas
          ref={canvas2dRef}
          className="fixed w-[512px] h-[512px] top-0 left-0 z-10 pointer-events-none"></canvas>
      )}
    </div>
  );
}
