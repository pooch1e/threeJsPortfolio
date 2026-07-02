import { useSearchParams } from "react-router-dom";
import { useWorld } from "../hooks/useWorld";
import { RectExperience } from "../../world/rectPerception/RectExperience";

export default function RectPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";

  const { canvasRef } = useWorld(RectExperience, { debug: debugMode }, []);
  return (
    <div className="w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
