import { useState } from 'react';

const SHADERS = [
  { key: 'basicShader', label: 'Basic Perlin Noise' },
  { key: 'wavesShader', label: 'Waves' },
  { key: 'galaxyShader', label: 'Galaxy' },
  { key: 'leePerryShader', label: 'Lee Perry' },
  { key: 'coffeeSmokeShader', label: 'Coffee Smoke' },
  { key: 'hologramShader', label: 'Holograms' },
  { key: 'fireworksShader', label: 'Fireworks' },
  { key: 'lightingBasicsShader', label: 'Lighting Basics' },
  { key: 'halftoneShader', label: 'Halftone Shader' },
  { key: 'earthShader', label: 'Earth' },
  { key: 'particlesAnimationShader', label: 'Mouse Particles Animation' },
  { key: 'morphingParticlesShader', label: 'Morphing Particles' },
  { key: 'gppuFlowFieldShader', label: 'GPPU Flow Field' },
  { key: 'wobblySphereShader', label: 'Wobbly Sphere' },
  { key: 'proceduralTerrain', label: 'Procedural Terrain' },
  { key: 'slicedModel', label: 'Sliced Model' },
  { key: 'postProcessing', label: 'Post Processing' },
];

export default function ShaderSwitchListButton({ setShaderChoice }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = (shaderName) => {
    setShaderChoice(shaderName);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-28 left-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 h-10 rounded-full bg-[var(--color-bg)]/70 text-[var(--text-primary)] backdrop-blur
          border border-transparent hover:text-[var(--text-alt)] hover:border-[var(--text-alt)]
          transition-colors ease-linear focus:outline-none font-offbit text-100 uppercase tracking-widest">
        Shaders
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <ul
            className="absolute left-0 mt-2 w-56 max-h-[70vh] overflow-y-auto rounded-md
              bg-[#1a1a1a] border border-gray-700 shadow-xl z-20 py-1">
            {SHADERS.map(({ key, label }) => (
              <li
                key={key}
                className="px-4 py-2 font-offbit text-100 text-gray-200 hover:bg-gray-800 hover:text-[var(--object-alt)]
                  cursor-pointer transition-colors ease-linear"
                onClick={() => handleButtonClick(key)}>
                {label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
