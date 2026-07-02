# The Experience → World → Objects chain

Every scene follows the same four-tier chain from React down to individual meshes:

```
Page component → useWorld hook → *Experience class → World class → leaf object classes
```

This doc traces one concrete example — `rectPerception` (route `/rects`) — file by file.

## 1. Page component (`src/pages/RectPage.jsx`)

```jsx
import { useWorld } from "../hooks/useWorld";
import { RectExperience } from "../../world/rectPerception/RectExperience";

export default function PortalPage() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";
  const { canvasRef } = useWorld(RectExperience, { debug: debugMode }, []);
  return (
    <div className="w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
```

Reads `?debug=true` from the URL, calls `useWorld` with the Experience **class** (not an instance) plus an options object, and renders a bare `<canvas>` wired to `canvasRef`.

## 2. `useWorld` hook (`src/hooks/useWorld.jsx`)

```jsx
export function useWorld(worldClass, options = {}, dependencies = []) {
  const canvasRef = useRef(null);
  const worldRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && worldClass) {
      worldRef.current = new worldClass(canvasRef.current, options);
    }
    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();
        worldRef.current = null;
      }
    };
  }, [worldClass, ...dependencies]);
  return { canvasRef, worldRef };
}
```

Bridges React's lifecycle to the imperative Experience class: instantiates `new worldClass(canvasElement, options)` once the canvas ref mounts, and calls `.destroy()` on unmount or when `dependencies` change. Every scene page uses this same hook — despite the name, it's generic across all Experience classes, not specific to one "world."

## 3. Experience class (`world/rectPerception/RectExperience.js`)

```js
constructor(canvas, options = {}) {
  this.canvas = canvas;
  this.debug = new Debug(options.debug);
  this.sizes = new Sizes();
  this.time = new Time();
  this.scene = new Scene();
  this.resources = new EventEmitter(); // stub — this scene loads no assets

  this.camera = new Camera({ canvas: this.canvas, sizes: this.sizes, controls: true });
  this.renderer = new Renderer({ canvas: this.canvas, sizes: this.sizes, scene: this.scene, camera: this.camera });

  this.world = new World(this); // World receives the whole Experience as `this`

  this.sizes.on("resize", () => this.resize());
  this.time.on("tick", () => this.update());
}
```

This is the orchestrator: it instantiates every core util ([Debug](debug.md), `Sizes`, `Time`) and shared object (`Camera`, `Renderer` — both in `world/objects/`), then hands itself (`this`) to `World`. `resize()` delegates to `camera.resize()` + `renderer.resize()`. `update()` drives `camera.update()`, `renderer.update()`, and `world.update(this.time)` every tick. `destroy()` unregisters listeners, delegates to `world.destroy()`, walks the scene disposing geometries/materials, and disposes `OrbitControls` + the `WebGLRenderer`.

## 4. World class (`world/rectPerception/World.js`)

```js
constructor(rectExperience) {
  this.rectExperience = rectExperience;
  this.debug = this.rectExperience.debug;
  this.scene = this.rectExperience.scene;
  this.resources = this.rectExperience.resources;
  // ... builds scene content, e.g. instantiates Ribbon objects
}
```

`World` takes the Experience instance as its only constructor arg and pulls out what it needs (`scene`, `debug`, `resources`, `time`). Scenes with no async assets (like this one) build scene content directly in the constructor; scenes with real `Resources` defer to `resources.on('ready', () => { ... })` instead (see [resources.md](resources.md)).

## 5. Leaf object class (`world/rectPerception/Ribbon.js`)

The bottom of the chain — takes config (`{ world, xOffset, xWidth, ... }`), pulls `scene`/`debug`/`time` off `world`/`world.rectExperience`, builds Three.js primitives (`PlaneGeometry` meshes grouped into a `Group`), and adds them to `scene`.

## Shared object utilities used along the way

- `world/objects/Camera.js` — `Camera({ canvas, fov=75, sizes, near=0.1, far=2000, controls=true })`. Wraps a `PerspectiveCamera` + optional `OrbitControls`. Exposes `.resize()` and `.update()`.
- `world/objects/Renderer.js` — `Renderer({ canvas, sizes, scene, camera })`. Wraps `WebGLRenderer` (tone mapping, shadow map, size/pixel-ratio). Exposes `.resize()` and `.update()`, which calls `renderer.render(scene, camera.perspectiveCamera)` (skipped when `usePostProcessing` is true, used by `shaderTestWorld/PostProcessing.js`).

## Variant: scenes with real asset loading

`portalWorld` and `animalWorld` follow the identical chain but swap the `resources` stub for a real [`Resources`](resources.md) instance and defer scene construction until its `'ready'` event fires. See `world/portalWorld/{PortalExperience,World,Portal}.js` or `world/animalWorld/{ModelExperience,World,Fox,Rat,Floor,Environment}.js` for that variant end to end.

See [scenes.md](scenes.md) for the full list of scenes and how each one varies on this pattern, and [index.md](index.md) for the top-level overview.
