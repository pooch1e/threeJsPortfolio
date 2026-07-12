import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { experienceBySlug } from "../config/experienceConfig";
import ExperienceCanvas from "../components/ExperienceCanvas";
import ExperienceChrome from "../components/ExperienceChrome";
import ShaderView from "./ShaderView";
import LoadingOverlay from "../components/LoadingOverlay";

// Single page for the /experience/:slug route. Resolves the lazily-loaded
// Experience class from config and renders it full-screen with floating chrome.
export default function ExperienceView() {
  const { slug } = useParams();
  const cfg = experienceBySlug[slug];

  const [ExpClass, setExpClass] = useState(null);

  useEffect(() => {
    if (!cfg || cfg.custom) return;
    let active = true;
    setExpClass(null);
    cfg.load().then((cls) => {
      if (active) setExpClass(() => cls);
    });
    return () => {
      active = false;
    };
  }, [cfg]);

  if (!cfg) return <Navigate to="/homepage" replace />;

  if (cfg.custom === "shader") {
    return (
      <>
        <ExperienceChrome />
        <ShaderView />
      </>
    );
  }

  if (!ExpClass) return <LoadingOverlay />;

  return (
    <>
      <ExperienceChrome />
      <ExperienceCanvas experienceClass={ExpClass} className={cfg.className} />
    </>
  );
}
