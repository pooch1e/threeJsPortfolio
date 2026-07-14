import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ExperienceCanvas from "../components/ExperienceCanvas";
import { ShaderExperience } from "../../world/shaderTestWorld/ShaderExperience";
import ShaderSwitchListButton from "../components/ShaderSwitchListButton";

// The one experience that isn't uniform: it defaults debug ON, swaps shaders
// at runtime, and renders a second 2D canvas.
export default function ShaderView() {
  const [shaderChoice, setShaderChoice] = useState(null);
  const canvas2dRef = useRef(null);
  const worldRefRef = useRef(null);

  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") !== "false";

  useEffect(() => {
    const world = worldRefRef.current?.current?.world;
    if (shaderChoice && world) {
      world.loadPractice(shaderChoice, canvas2dRef.current);
    }
  }, [shaderChoice, debugMode]);

  return (
    <ExperienceCanvas
      experienceClass={ShaderExperience}
      debugDefault
      className="bg-[#798086]">
      {({ worldRef }) => {
        worldRefRef.current = worldRef;
        return (
          <>
            <ShaderSwitchListButton setShaderChoice={setShaderChoice} />
            {shaderChoice === "particlesAnimationShader" && (
              <canvas
                ref={canvas2dRef}
                className="fixed w-[256px] h-[256px] top-14 left-0 z-10 pointer-events-none"></canvas>
            )}
          </>
        );
      }}
    </ExperienceCanvas>
  );
}
