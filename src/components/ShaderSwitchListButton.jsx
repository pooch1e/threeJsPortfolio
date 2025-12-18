import { useState } from 'react';

export default function ShaderSwitchListButton({ setShaderChoice }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = (shaderName) => {
    setShaderChoice(shaderName);
    setIsOpen(false);
  };

  return (
    <div className="relative p-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-800 text-white rounded-md">
        Choose Shader
      </button>

      {isOpen && (
        <ul className="absolute left-0 mt-2 w-56 rounded-md bg-gray-800 ring-1 ring-white/10 text-white">
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('basicShader')}>
            Basic Perlin Noise
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('wavesShader')}>
            Waves
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('galaxyShader')}>
            Galaxy
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('leePerryShader')}>
            Lee Perry
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('coffeeSmokeShader')}>
            Coffee Smoke
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('hologramShader')}>
            Holograms
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('fireworksShader')}>
            Fireworks
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('lightingBasicsShader')}>
            Lighting Basics
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('halftoneShader')}>
            Halftone Shader
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('earthShader')}>
            Earth
          </li>
          <li
            className="py-2 px-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleButtonClick('particlesAnimationShader')}>
            Particles Animation
          </li>
        </ul>
      )}
    </div>
  );
}
