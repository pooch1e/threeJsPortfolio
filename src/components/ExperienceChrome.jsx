import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Bug } from "./icons";
import { transitionStore } from "../store/transitionStore";

export default function ExperienceChrome({ debugDefault = false }) {
  const setTargetPath = transitionStore((s) => s.setTargetPath);
  const [searchParams, setSearchParams] = useSearchParams();
  const debugMode = debugDefault
    ? searchParams.get("debug") !== "false" // default ON
    : searchParams.get("debug") === "true"; // default OFF

  const toggleDebug = () => {
    setSearchParams({ debug: debugMode ? "false" : "true" });
  };

  const buttonClass =
    "fixed z-20 left-4 flex items-center justify-center w-10 h-10 rounded-full " +
    "bg-[var(--color-bg)]/70 text-[var(--text-primary)] backdrop-blur " +
    "border border-transparent hover:text-[var(--text-alt)] hover:border-[var(--text-alt)] transition-colors ease-linear focus:outline-none";

  return (
    <>
      <button
        className={`${buttonClass} top-4`}
        onClick={() => setTargetPath("/homepage")}
        title="Back to home"
        aria-label="Back to home">
        <ArrowLeft size={16} />
      </button>
      <button
        className={`${buttonClass} top-16 ${debugMode ? "text-[var(--colour-bg-mid-light)] border-accent" : ""}`}
        onClick={toggleDebug}
        title="Toggle debug"
        aria-label="Toggle debug">
        <Bug size={16} />
      </button>
    </>
  );
}
