import { useSearchParams } from 'react-router-dom';
import { useWorld } from '../hooks/useWorld';
import { ShaderExperience } from '../../world/shaderTestWorld/ShaderExperience';
import ShaderSwitchListButton from '../components/ShaderSwitchListButton';
import { useState, useEffect } from 'react';
export default function AnimalRenderPage() {
  const [shaderChoice, setShaderChoice] = useState('basicShader');
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef, worldRef } = useWorld(
    ShaderExperience,
    { debug: debugMode },
    [debugMode]
  );

  useEffect(() => {
    if (worldRef.current?.world) {
      worldRef.current.world.loadPractice(shaderChoice);
    }
  }, [shaderChoice, worldRef]);

  return (
    <div className="border-2">
      <ShaderSwitchListButton setShaderChoice={setShaderChoice} />
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
