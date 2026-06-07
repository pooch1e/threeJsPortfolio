# ComputerPage — Vanilla Three.js Implementation Plan

Recreates the R3F `IntroExperience` component (camera zoom, video screen, presentation
controls, env lighting, contact shadow, HTML overlay) using the repo's existing vanilla
Three.js class patterns.

Route: `/computer`
Model: `/static/models/computer/computer_nodeNamed.glb`
Video: `/static/videos/dev_compressed.mp4` *(drop file here before running)*

---

## 1. Files to Create

```
world/computer/
├── PLAN.md                    ← this file
├── computerSources.js         ← local asset manifest (model + HDR only)
├── ComputerExperience.js      ← top-level orchestrator (mirrors ModelExperience.js)
├── ComputerWorld.js           ← scene-graph manager (mirrors animalWorld/World.js)
├── ComputerDesk.js            ← GLTF + video texture + presentation controls + zoom
├── ComputerEnvironment.js     ← HDR env map + lights + bg color
└── ComputerShadow.js          ← contact shadow plane

src/pages/ComputerPage.jsx     ← React page: canvas + HTML overlay + fade-out
```

## 2. Files to Update

| File | Change |
|---|---|
| `src/App.jsx` | Lazy route at `/computer` inside `ProtectedRoute > MainLayout` |
| `src/config/projectLinksConfig.js` | Add `{ order: "008", projectName: "Intro", url: "/computer" }` |
| `vite.config.js` | Add `world-computer` manual chunk |

---

## 3. Asset Prerequisites

```
static/videos/dev_compressed.mp4   ← must be placed manually before testing
```

`ComputerDesk` will wire up `THREE.VideoTexture` to this path. If the video element
fails to load (404), the screen mesh keeps its original baked texture and no error
is thrown (handled via the `video.onerror` event).

---

## 4. `computerSources.js`

Local sources array — only what this world needs. Avoids loading the full global
`sources.js` manifest (fox, rat, portal, etc.) before the scene is ready.

```js
export const computerSources = [
  {
    name: 'computerModel',
    type: 'gltfModel',
    path: '/static/models/computer/computer_nodeNamed.glb',
  },
  {
    name: 'computerEnvMap',
    type: 'hdrTexture',
    path: '/static/textures/urbanStreet/urban_alley_01_1k.hdr',
  },
];
```

---

## 5. `ComputerExperience.js`

Mirrors `ModelExperience.js` exactly with two differences:

1. Camera constructed with `fov: 45, controls: false` — no OrbitControls, we handle
   rotation ourselves.
2. `options.onReady` and `options.onIntroComplete` stored and forwarded into `World`.

```js
import { Scene, Mesh } from 'three';
import { Sizes }    from '../utils/Sizes.js';
import { Time }     from '../utils/Time.js';
import { Camera }   from '../objects/Camera.js';
import { Renderer } from '../objects/Renderer.js';
import { Debug }    from '../utils/Debug.js';
import { ComputerWorld } from './ComputerWorld.js';

export class ComputerExperience {
  constructor(canvas, options = {}) {
    this.canvas   = canvas;
    this.debug    = new Debug(options.debug);
    this.sizes    = new Sizes();
    this.time     = new Time();
    this.scene    = new Scene();
    this.options  = options;           // carries onReady, onIntroComplete

    this.camera = new Camera({
      canvas: this.canvas,
      sizes:  this.sizes,
      fov:    45,
      controls: false,               // presentation controls live in ComputerDesk
    });

    // Position camera to match R3F: position (0,0,5) looking at origin
    this.camera.perspectiveCamera.position.set(0, 0, 5);

    this.renderer = new Renderer({
      canvas:   this.canvas,
      sizes:    this.sizes,
      scene:    this.scene,
      camera:   this.camera,
    });

    this.world = new ComputerWorld(this);

    this.sizes.on('resize', () => { this.resize(); });
    this.time.on('tick',    () => { this.update(); });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.world.update();
    this.renderer.update();
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('tick');
    if (this.time.animationId) cancelAnimationFrame(this.time.animationId);
    this.world.destroy?.();
    this.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        for (const key in child.material) {
          const val = child.material[key];
          if (val && typeof val.dispose === 'function') val.dispose();
        }
      }
    });
    this.renderer.instance?.dispose();
    this.debug.active && this.debug.ui?.destroy();
  }
}
```

---

## 6. `ComputerWorld.js`

Mirrors `animalWorld/World.js`. Uses the local `computerSources` manifest so the
`resources.on('ready')` fires as soon as the model + HDR are loaded (not the entire
global asset list).

```js
import { Resources }           from '../utils/Resources.js';
import { computerSources }     from './computerSources.js';
import { ComputerDesk }        from './ComputerDesk.js';
import { ComputerEnvironment } from './ComputerEnvironment.js';
import { ComputerShadow }      from './ComputerShadow.js';

export class ComputerWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene      = experience.scene;

    this.resources = new Resources(computerSources);

    this.resources.on('ready', () => {
      this.environment = new ComputerEnvironment(this);
      this.shadow      = new ComputerShadow(this);
      this.desk        = new ComputerDesk(this);

      // Signal React page that the scene is ready (loading overlay can be dismissed)
      this.experience.options.onReady?.();
    });
  }

  update() {
    this.desk?.update();
  }

  destroy() {
    this.desk?.destroy();
  }
}
```

---

## 7. `ComputerDesk.js`

The core class. Handles:
- GLTF placement
- Video texture on screen mesh
- PresentationControls emulation (pointer drag)
- Click-to-zoom via GSAP + `onIntroComplete` callback

### 7a. GLTF placement (matches R3F primitive props)

```js
this.model = this.resources.items.computerModel.scene;
this.model.scale.setScalar(0.5);
this.model.position.set(2.0, -1.5, -2.5);
this.model.rotation.y = 1;            // matches rotation-y={1}
this.scene.add(this.model);
```

### 7b. Video texture

```js
const video = document.createElement('video');
video.src    = '/static/videos/dev_compressed.mp4';
video.loop   = true;
video.muted  = true;
video.playsInline = true;
video.crossOrigin = 'anonymous';

const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;

// Find screen mesh — traverse and match node name containing "screen" (case-insensitive)
this.model.traverse((child) => {
  if (child.isMesh && /screen/i.test(child.name)) {
    this.screenMesh = child;
    child.material = new THREE.MeshBasicMaterial({ map: videoTexture });
  }
});

// Start playback only after a gesture (autoplay policy)
// video.play() is called inside the click handler
video.onerror = () => console.warn('ComputerDesk: video not found, keeping baked texture');
this.video = video;
this.videoTexture = videoTexture;
```

> **Note**: `video.play()` is triggered inside the click handler (not on load) to
> satisfy browser autoplay policies without requiring a muted autoplay workaround.

### 7c. PresentationControls emulation

Target rotation state with damped lerp — matches R3F props:
```
global: true     → rotate model group, not camera
rotation: [0.2, 0.1, 0]  → initial X/Y rotation of the model group
polar:   [-0.025, 0.025] → X clamp (up/down)
azimuth: [-0.025, 0.125] → Y clamp (left/right)
```

```js
// State
this.targetX   = 0.2;    // initial rotation.x (polar initial)
this.targetY   = 1.1;    // model's base rotation.y (1 rad) + 0.1 azimuth initial
this.isDragging = false;
this.dragStart  = { x: 0, y: 0 };
this.enabled    = true;   // set false after zoom click

const BASE_Y    =  1.0;   // model's permanent base y rotation
const POLAR_MIN = -0.025, POLAR_MAX = 0.025;
const AZ_MIN    = BASE_Y - 0.025, AZ_MAX = BASE_Y + 0.125;

// Pointer handlers (stored as arrow functions for removeEventListener)
this._onDown  = (e) => { ... };
this._onMove  = (e) => { ... };
this._onUp    = (e) => { ... };
this._onClick = (e) => { ... };

canvas.addEventListener('pointerdown', this._onDown);
canvas.addEventListener('pointermove', this._onMove);
canvas.addEventListener('pointerup',   this._onUp);
canvas.addEventListener('click',       this._onClick);
```

`update()`:
```js
update() {
  if (!this.enabled) return;
  this.model.rotation.x += (this.targetX - this.model.rotation.x) * 0.1;
  this.model.rotation.y += (this.targetY - this.model.rotation.y) * 0.1;
}
```

### 7d. Click-to-zoom (GSAP)

Requires: `import gsap from 'gsap'`

Camera initial state:
- `position: (0, 0, 5)`, lookAt `(0, 0, 0)`, `fov: 45`

Zoom target (camera moves to look closely at the screen):
- `position: (2.2, -1.0, 0.2)` — positioned in front of the screen
- `fov: 30` — narrower FOV reinforces zoom feeling
- `lookAt: (2.0, -1.5, -2.5)` — looking at model center (refined after seeing actual screen position)

```js
_onClick(e) {
  // Ignore if it was actually a drag
  if (this.wasDrag) return;

  this.enabled = false;  // freeze presentation controls

  // Start video (satisfies autoplay policy — inside user gesture)
  this.video.play().catch(() => {});

  const cam    = this.experience.camera.perspectiveCamera;
  const lookAt = { x: 2.0, y: -1.5, z: -2.5 };

  gsap.to(cam.position, {
    x: 2.2, y: -1.0, z: 0.2,
    duration: 1.8,
    ease: 'power2.inOut',
    onUpdate: () => {
      cam.lookAt(lookAt.x, lookAt.y, lookAt.z);
    },
    onComplete: () => {
      this.experience.options.onIntroComplete?.();
    },
  });

  gsap.to(cam, {
    fov: 30,
    duration: 1.8,
    ease: 'power2.inOut',
    onUpdate: () => { cam.updateProjectionMatrix(); },
  });
}
```

### 7e. `destroy()`

```js
destroy() {
  const canvas = this.experience.canvas;
  canvas.removeEventListener('pointerdown', this._onDown);
  canvas.removeEventListener('pointermove', this._onMove);
  canvas.removeEventListener('pointerup',   this._onUp);
  canvas.removeEventListener('click',       this._onClick);
  this.video.pause();
  this.videoTexture?.dispose();
}
```

---

## 8. `ComputerEnvironment.js`

Matches `<Environment preset="city" />` using the existing `urbanStreet` HDR.

```js
import { PMREMGenerator, AmbientLight, DirectionalLight, Color } from 'three';

export class ComputerEnvironment {
  constructor(world) {
    this.world    = world;
    this.scene    = world.scene;
    this.renderer = world.experience.renderer.instance;

    // Background color (matches R3F <color args={["#f2f0ef"]} />)
    this.scene.background = new Color('#f2f0ef');

    this.setEnvMap();
    this.setLights();
  }

  setEnvMap() {
    const pmrem = new PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    const hdr = this.world.resources.items.computerEnvMap;
    const envMap = pmrem.fromEquirectangular(hdr).texture;

    this.scene.environment = envMap;
    pmrem.dispose();
  }

  setLights() {
    // Fill light
    this.ambient = new AmbientLight('#ffffff', 0.5);
    this.scene.add(this.ambient);

    // Shadow-casting key light
    this.sun = new DirectionalLight('#ffffff', 2);
    this.sun.position.set(3, 5, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.far = 20;
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun);
  }
}
```

---

## 9. `ComputerShadow.js`

Matches `<ContactShadows position-y={-1.3} opacity={0.4} scale={5} blur={2.4} />`
using a real shadow-receiving plane under the model.

```js
import { PlaneGeometry, ShadowMaterial, Mesh } from 'three';

export class ComputerShadow {
  constructor(world) {
    this.scene = world.scene;

    const geo = new PlaneGeometry(5, 5);
    const mat = new ShadowMaterial({ opacity: 0.4, transparent: true });

    this.mesh = new Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = -1.3;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);

    // Model must also have castShadow = true — set this in ComputerDesk
    // this.model.traverse(c => { if (c.isMesh) c.castShadow = true; });
  }
}
```

`ComputerDesk` sets `castShadow = true` on each mesh in the GLTF traverse.

---

## 10. `src/pages/ComputerPage.jsx`

```jsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useWorld }           from '../hooks/useWorld';
import { ComputerExperience } from '../../world/computer/ComputerExperience';

export default function ComputerPage() {
  const navigate = useNavigate();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayRef = /* useRef */ null; // used for GSAP fade

  const onReady = useCallback(() => {
    // optional: could dismiss a LoadingOverlay here if needed
  }, []);

  const onIntroComplete = useCallback(() => {
    // Fade out canvas + overlay, then navigate to /homepage
    gsap.to('.computer-canvas-wrapper', {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => navigate('/homepage'),
    });
  }, [navigate]);

  const { canvasRef } = useWorld(
    ComputerExperience,
    { onReady, onIntroComplete },
    []
  );

  return (
    <div className="computer-canvas-wrapper relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-screen" />

      {/* HTML overlay — mirrors <Html wrapperClass="introText" position={[-2.5, 1, 0]}> */}
      {overlayVisible && (
        <div className="absolute pointer-events-none"
             style={{ left: '8%', top: '28%' }}>
          <h1 className="text-5xl font-karrik" style={{ color: 'var(--text-color-verydark)' }}>
            Joel Kram
          </h1>
          <h2 className="text-2xl font-karrik mt-2" style={{ color: 'var(--text-color-verydark)' }}>
            Software Developer
          </h2>
          <h3 className="text-lg font-karrik mt-4" style={{ color: 'var(--text-color-verydark)' }}>
            Scroll down ⇩
          </h3>
        </div>
      )}
    </div>
  );
}
```

> **Note on `onReady`/`onIntroComplete` stability**: Both callbacks are wrapped in
> `useCallback` with stable deps. `useState` setters and `useNavigate` are stable
> across renders, so the Experience constructor always receives the intended functions
> and `useWorld`'s dependency array stays `[]`.

---

## 11. `src/App.jsx` addition

Add inside the `ProtectedRoute > MainLayout` block, alongside existing routes:

```jsx
const ComputerPage = lazy(() => import('./pages/ComputerPage'));

// inside Routes:
<Route
  path="/computer"
  element={
    <Suspense fallback={<LoadingOverlay />}>
      <ComputerPage />
    </Suspense>
  }
/>
```

---

## 12. `vite.config.js` addition

Add to `manualChunks`:

```js
'world-computer': [
  './world/computer/ComputerExperience.js',
  './world/computer/ComputerWorld.js',
  './world/computer/ComputerDesk.js',
  './world/computer/ComputerEnvironment.js',
  './world/computer/ComputerShadow.js',
],
```

---

## 13. `src/config/projectLinksConfig.js` addition

```js
{ order: "008", projectName: "Intro", url: "/computer" },
```

---

## 14. Implementation order

Work in this order to be able to test incrementally:

1. `computerSources.js`
2. `ComputerEnvironment.js`
3. `ComputerShadow.js`
4. `ComputerDesk.js` — start with GLTF only (no video, no controls)
5. `ComputerWorld.js`
6. `ComputerExperience.js`
7. `ComputerPage.jsx` — start with `onReady`/`onIntroComplete` as `console.log`
8. Wire routes + config + vite chunk
9. Add video texture to `ComputerDesk`
10. Add presentation controls to `ComputerDesk`
11. Add GSAP camera zoom + `onIntroComplete` → navigate
12. Drop `/static/videos/dev_compressed.mp4` and verify video texture

---

## 15. Key technical notes

**Screen mesh name**
The model is `computer_nodeNamed.glb` — nodes are intentionally named. Traverse
with `/screen/i` regex. If no match, log a warning: `console.warn('No screen mesh found')`.
If needed, open the model in [gltf.report](https://gltf.report) to confirm the node name.

**Autoplay policy**
`video.play()` must be called inside a user gesture handler. Starting it inside the
`_onClick` handler satisfies this. Do not call `video.play()` on resource load.

**Camera `lookAt` in animation**
Three.js cameras don't have a built-in animatable `lookAt` target like R3F.
GSAP animates a plain `lookAtTarget = { x, y, z }` object; the `onUpdate` callback
calls `cam.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z)` each frame.

**`PMREMGenerator` teardown**
`pmrem.dispose()` is called immediately after generating the env map — the generator
is not needed again. The rendered env map texture itself is cleaned up in `destroy()`
via the scene traverse (if assigned to `scene.environment`, it must be disposed separately).

**Shadow receiver requires renderer `shadowMap.enabled`**
`Renderer.js` must have `this.instance.shadowMap.enabled = true` for `ShadowMaterial`
to work. Check the existing `Renderer.js` — if it's not already enabled, add it.
