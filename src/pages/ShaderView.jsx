import { useState, useEffect, useRef } from "react";
import ExperienceCanvas from "../components/ExperienceCanvas";
import { ShaderExperience } from "../../world/shaderTestWorld/ShaderExperience";
import ShaderSwitchListButton from "../components/ShaderSwitchListButton";
import LoadingBar from "../components/LoadingBar";

// The one experience that isn't uniform: it defaults debug ON, listens to world
// loading events, swaps shaders at runtime, and renders a second 2D canvas.
export default function ShaderView() {
  const [shaderChoice, setShaderChoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvas2dRef = useRef(null);
  const worldRefRef = useRef(null);

  // Subscribe to loading events from the World once it exists.
  useEffect(() => {
    const world = worldRefRef.current?.current?.world;
    if (!world) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleLoadComplete = () => setIsLoading(false);

    world.on("loadstart", handleLoadStart);
    world.on("loadcomplete", handleLoadComplete);

    return () => {
      world.off("loadstart");
      world.off("loadcomplete");
    };
  }, []);

  // Swap the active shader when the dropdown changes.
  useEffect(() => {
    const world = worldRefRef.current?.current?.world;
    if (shaderChoice && world) {
      world.loadPractice(shaderChoice, canvas2dRef.current);
    }
  }, [shaderChoice]);

  return (
    <ExperienceCanvas
      experienceClass={ShaderExperience}
      debugDefault
      className="bg-[#798086]">
      {({ worldRef }) => {
        worldRefRef.current = worldRef;
        return (
          <>
            <LoadingBar isLoading={isLoading} />
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
