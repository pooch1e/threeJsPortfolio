import { useSearchParams } from "react-router-dom";
import { useWorld } from "../hooks/useWorld";
import { FlowerExperience } from "../../world/flowerWorld/FlowerExperience";
export default function AsciiPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";

  const { canvasRef } = useWorld(FlowerExperience, { debug: debugMode }, []);
  return (
    <div className="w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
