import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { ShaderExperience } from '../../world/shaderTestWorld/ShaderExperience';
import ShaderSwitchListButton from '../components/ShaderSwitchListButton';
import { useState, useEffect } from 'react';
export default function AnimalRenderPage() {
  const [shaderChoice, setShaderChoice] = useState(null);
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef, worldRef } = useWorld(
    ShaderExperience,
    { debug: debugMode },
    [debugMode]
  );

  useEffect(() => {
    if (shaderChoice && worldRef.current?.world) {
      worldRef.current.world.loadPractice(shaderChoice);
    }
  }, [shaderChoice]);

  return (
    <div className=" bg-[#798086]">
      <ShaderSwitchListButton setShaderChoice={setShaderChoice} />
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
