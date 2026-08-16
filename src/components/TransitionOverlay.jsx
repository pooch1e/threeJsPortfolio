/**
 * TransitionOverlay — mounts the persistent pixelated-dissolve
 * TransitionExperience and drives it off transitionStore's phase, covering
 * the screen before a route change and revealing it after.
 */
import { useEffect } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { useWorld } from "../hooks/useWorld";
import { TransitionExperience } from "../../world/appShaders/transitions/TransitionExperience";
import { transitionStore } from "../store/transitionStore";

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TransitionOverlay() {
  const navigate = useNavigate();
  const { canvasRef, worldRef } = useWorld(TransitionExperience, {}, []);
  const phase = transitionStore((s) => s.phase);
  const targetPath = transitionStore((s) => s.targetPath);
  const setPhase = transitionStore((s) => s.setPhase);
  const reset = transitionStore((s) => s.reset);

  useEffect(() => {
    if (phase !== "covering" || !worldRef.current) return;

    if (REDUCED_MOTION) {
      navigate(targetPath);
      setPhase("finished");
      return;
    }

    const uniform = worldRef.current.material.uniforms.uProgress;
    const tween = gsap.to(uniform, {
      value: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        navigate(targetPath);
        setPhase("finished");
      },
    });
    return () => tween.kill();
  }, [phase, targetPath, navigate, setPhase, worldRef]);

  useEffect(() => {
    if (phase !== "finished" || !worldRef.current) return;

    if (REDUCED_MOTION) {
      reset();
      return;
    }

    const uniform = worldRef.current.material.uniforms.uProgress;
    const tween = gsap.to(uniform, {
      value: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: reset,
    });
    return () => tween.kill();
  }, [phase, reset, worldRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: phase === "idle" ? "none" : "auto" }}
    />
  );
}
