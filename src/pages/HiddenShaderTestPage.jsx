import { PatternExperience } from "../../tslWorld/patterns/PatternExperience";

import { useWorld } from "../hooks/useWorld"

export default function HiddenShaderTestPage() {
  const options = {
    inspector: true,
  }
  const { canvasRef } = useWorld(PatternExperience, options);
  
  
  return (
  <canvas ref={canvasRef} className="w-full h-full block"></canvas>
)  
}