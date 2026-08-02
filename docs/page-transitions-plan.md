# Page Transitions — Implementation Plan

Full-screen shader-dissolve transition (GSAP-driven) when navigating from the
home menu into a world scene, and back. No new dependencies — reuses
`gsap` (already `^3.14.1`), `three`, and `vite-plugin-glsl`, all already in
use elsewhere in this repo.

Work through the tasks in order. Each task is small and independently
testable before moving to the next.

---

## Task 1 — Transition store

Create `src/store/transition.js` (Zustand, same pattern as `src/store/user.js`).

```js
import { create } from "zustand";

export const useTransitionStore = create((set) => ({
  phase: "idle", // 'idle' | 'covering' | 'revealing'
  targetPath: null,
  start: (targetPath) => set({ phase: "covering", targetPath }),
  setPhase: (phase) => set({ phase }),
  reset: () => set({ phase: "idle", targetPath: null }),
}));
```

No UI yet — just the store. Sanity check: import it somewhere temporarily
and confirm `start()`/`reset()` update state (React DevTools or a console.log).

---

## Task 2 — Dissolve shader

Add shader files under `world/transition/shaders/` (same convention as
`world/asciiWorld/shaders/`, `world/portalWorld/shaders/`, etc.):

- `world/transition/shaders/vertex.glsl` — standard passthrough (position/uv).
- `world/transition/shaders/fragment.glsl` — noise-based dissolve:

```glsl
uniform float uProgress; // 0 = fully revealed, 1 = fully covered
uniform vec3 uColor;
varying vec2 vUv;

// any cheap noise fn (value noise or simplex — reuse one already in
// world/*/shaders if one exists, otherwise a standard 2D hash noise)
float noise(vec2 p) { /* ... */ }

void main() {
  float n = noise(vUv * 6.0);
  float edge = 0.08;
  float mask = smoothstep(uProgress - edge, uProgress + edge, n);
  // mask: 0 = show underlying page, 1 = covered by uColor
  gl_FragColor = vec4(uColor, 1.0 - mask);
}
```

Check `world/*/shaders/` for an existing noise function first — reuse rather
than re-writing one (e.g. `world/flowerWorld/shaders` or `world/asciiWorld/shaders`
likely already has one, per `vite-plugin-glsl` usage).

---

## Task 3 — TransitionExperience class

Create `world/transition/TransitionExperience.js`. This is **not** a scene
like the other 9 worlds — it's a single persistent fullscreen-quad renderer,
mounted once for the lifetime of the app (not per-route).

```js
import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export class TransitionExperience {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor: { value: new THREE.Color("#0a0a0a") },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.scene.add(new THREE.Mesh(geometry, this.material));

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop(() => this.render());
  }

  resize() {
    const { innerWidth, innerHeight } = window;
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setProgress(value) {
    this.material.uniforms.uProgress.value = value;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
```

No `BaseExperience` inheritance — it doesn't need `Time`/`Sizes`/`Resources`
utils, it's a single tween-driven uniform.

---

## Task 4 — TransitionOverlay component

Create `src/components/TransitionOverlay.jsx`, mounted once in `App.jsx`
(sibling to `<Routes>`, rendered above everything via z-index).

```jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { TransitionExperience } from "../../world/transition/TransitionExperience";
import { useTransitionStore } from "../store/transition";

export default function TransitionOverlay() {
  const canvasRef = useRef(null);
  const experienceRef = useRef(null);
  const navigate = useNavigate();
  const { phase, targetPath, setPhase, reset } = useTransitionStore();

  useEffect(() => {
    experienceRef.current = new TransitionExperience(canvasRef.current);
    return () => experienceRef.current.destroy();
  }, []);

  useEffect(() => {
    if (phase !== "covering") return;
    const tween = gsap.to(experienceRef.current.material.uniforms.uProgress, {
      value: 1,
      duration: 0.7,
      ease: "power2.inOut",
      onUpdate: () =>
        experienceRef.current.setProgress(
          experienceRef.current.material.uniforms.uProgress.value
        ),
      onComplete: () => {
        navigate(targetPath);
        setPhase("revealing");
      },
    });
    return () => tween.kill();
  }, [phase, targetPath]);

  useEffect(() => {
    if (phase !== "revealing") return;
    // small buffer so the new route/canvas has a frame to mount;
    // Task 6 replaces this with a real "world ready" wait.
    const id = setTimeout(() => {
      gsap.to(experienceRef.current.material.uniforms.uProgress, {
        value: 0,
        duration: 0.7,
        ease: "power2.inOut",
        onUpdate: () =>
          experienceRef.current.setProgress(
            experienceRef.current.material.uniforms.uProgress.value
          ),
        onComplete: reset,
      });
    }, 150);
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: phase === "idle" ? "none" : "auto" }}
    />
  );
}
```

Wire it into `src/App.jsx`: render `<TransitionOverlay />` once, outside/above
`<Routes>`, inside `<BrowserRouter>`.

---

## Task 5 — Wire up navigation triggers

**`src/components/ProjectCard.jsx`**: replace the plain
`<Link to={/experience/${slug}}>` with a clickable element that calls
`useTransitionStore().start(path)` and `preventDefault()`s default `Link`
navigation (or drop `Link` for a `div`/`button` + `useTransitionStore`, since
navigation now happens inside `TransitionOverlay`'s `onComplete`).

**`ExperienceChrome`** (back-to-home action): same treatment — replace its
`useNavigate()` call with `useTransitionStore().start('/homepage')`.

At this point the full transition should work end-to-end. Test:
click a world tile → screen dissolves to cover → route swaps underneath →
dissolve reveals the new world. Test the back action too.

---

## Task 6 — Sync reveal with actual world readiness (polish)

Replace the fixed `150ms` buffer in Task 4 with a real signal:

1. In `world/BaseExperience.js`, if not already exposed, confirm `Resources`
   emits `'ready'` once loading finishes.
2. In `src/hooks/useWorld.jsx`, accept an optional `onReady` in `options` and
   wire it to the Experience's resources-ready event.
3. In `ExperienceView.jsx`, on `onReady`, call
   `useTransitionStore().setPhase('revealing')` instead of relying on the
   overlay's own timeout — remove the `setTimeout` from Task 4 once this is
   wired, keeping only a small minimum-cover duration (e.g. `Math.max(150,
   readyDelay)`) so fast-loading scenes don't reveal instantly/jarringly.

---

## Task 7 — Reduced motion & edge cases

- Respect `prefers-reduced-motion`: check
  `window.matchMedia("(prefers-reduced-motion: reduce)").matches` in
  `TransitionOverlay` — if true, skip the tweens entirely, call `navigate()`
  immediately, and never animate `uProgress`.
- Guard against double-clicks/rapid navigation while `phase !== 'idle'`
  (ignore new `start()` calls, or kill+restart the current tween cleanly).
- Confirm `LoadingOverlay` (existing `Suspense` fallback) is not visible
  during the transition — it should be fully hidden behind the opaque
  `TransitionOverlay` at `z-[9999]`. Bump `LoadingOverlay`'s z-index below it
  if there's any flicker.

---

## Task 8 — Cross-browser / perf pass

- Verify on Safari (`WebGLRenderer` + `alpha: true` compositing can differ).
- Confirm no duplicate WebGL contexts are created (the overlay's renderer
  must persist across route changes — only created once in Task 4's mount
  `useEffect` with an empty dependency array).
- Check mobile perf (pixel ratio cap already set to `2` in
  `TransitionExperience.resize()`).

---

## Done criteria

- Clicking any `ProjectCard` on the home page triggers a full-screen dissolve
  before the world scene appears, and the same effect plays in reverse when
  navigating back.
- No new npm dependencies were added.
- Transition works for all 9 world routes without per-world code changes.
- Reduced-motion users get instant navigation, no animation.
