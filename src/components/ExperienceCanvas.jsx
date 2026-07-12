import { useSearchParams } from "react-router-dom";
import { useWorld } from "../hooks/useWorld";

export default function ExperienceCanvas({
  experienceClass,
  debugDefault = false,
  options = {},
  className,
  canvasClassName,
  children,
}) {
  const [searchParams] = useSearchParams();
  const debugMode = debugDefault
    ? searchParams.get("debug") !== "false" // default ON
    : searchParams.get("debug") === "true"; // default OFF

  const { canvasRef, worldRef } = useWorld(
    experienceClass,
    { debug: debugMode, ...options },
    [debugMode]
  );

  return (
    <div className={`w-full h-screen ${className ?? ""}`}>
      <canvas ref={canvasRef} className={`w-full h-full block ${canvasClassName ?? ""}`} />
      {typeof children === "function" ? children({ worldRef }) : children}
    </div>
  );
}
