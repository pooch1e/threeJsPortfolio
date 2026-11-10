import { PatternExperience } from "../../tslWorld/patterns/PatternExperience";
import { PatternWorld } from "../../tslWorld/patterns/PatternWorld"
import { useWorld } from "../hooks/useWorld"

export default function HiddenShaderTestPage() {
  const { canvasRef } = useWorld(PatternExperience);
  
  
  return (
  <canvas ref={canvasRef} className="w-full h-full block"></canvas>
)  
}