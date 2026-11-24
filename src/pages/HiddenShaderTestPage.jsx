// import { PatternExperience } from "../../tslWorld/patterns/PatternExperience";
import { RbiExperience } from "../../tslWorld/worldRbiTest/RbiExperience";
import { useWorld } from "../hooks/useWorld"

export default function HiddenShaderTestPage() {
  const options = {
    inspector: true,
  }
  const { canvasRef } = useWorld(RbiExperience, options);
  
  
  return (
  <canvas ref={canvasRef} className="w-full h-full block"></canvas>
)  
}