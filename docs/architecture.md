# Architecture Documentation

## Project Overview

This is a creative portfolio showcasing 3D graphics experiments using both Three.js and p5.js, wrapped in a React application.

```
threejsPortfolio/
├── src/                    # React application
│   ├── hooks/              # useWorld.jsx, useP5World.jsx
│   ├── pages/              # Route pages
│   └── p5/                 # p5.js sketch implementations
├── world/                  # Three.js world implementations
│   ├── BaseExperience.js   # Shared scene/camera/renderer/loop machinery
│   ├── objects/            # Camera, Renderer
│   ├── utils/              # Time, Sizes, Mouse, Debug, Resources, EventEmitter
│   ├── sources/            # Asset definitions
│   ├── shaderTestWorld/    # 17+ shader experiments
│   ├── sineWorld/          # Sine wave visualization
│   ├── pointCloudWorld/    # 3D point cloud
│   ├── rectPerception/     # Scrolling ribbon groups
│   ├── flowerWorld/        # GPGPU particle flowers
│   ├── forestWorld/        # Tiled flower grid
│   ├── portalWorld/        # Baked portal + fireflies
│   ├── asciiWorld/         # ASCII character grid
│   └── animalWorld/        # Animal model rendering
├── static/                 # GLTF models, textures, HDR
└── docs/                   # This documentation
```

---

## Three.js World Architecture

The Three.js implementation follows an **Experience → World → Objects** pattern.

### Layer Structure

```
┌─────────────────────────────────────┐
│           React Page                │  ← useWorld.jsx hook
├─────────────────────────────────────┤
│         Experience Class            │  ← Orchestrator (camera, renderer, scene)
├─────────────────────────────────────┤
│           World Class               │  ← Content manager (loads specific world)
├─────────────────────────────────────┤
│         Objects/Components          │  ← Three.js meshes, materials, shaders
├─────────────────────────────────────┤
│           Core Utilities            │  ← Time, Sizes, Mouse, Debug, Resources
└─────────────────────────────────────┘
```

### Experience Layer

Every scene extends `BaseExperience` (`world/BaseExperience.js`), which owns the
canvas, scene, sizes, time loop, debug panel, resources, camera, renderer and
teardown. Subclasses do not reimplement the constructor — they override hooks:

| Hook | Purpose | Overridden by |
|------|---------|---------------|
| `createWorld()` | **Required.** Returns the scene's World | all scenes |
| `createResources()` | Returns a `Resources`; defaults to a bare emitter | Flower, Forest, Portal, Model, Shader |
| `cameraOptions()` | Options forwarded to `Camera` (fov, controls, near/far) | Ascii, Forest |
| `setupCamera()` | Position/aim the camera once it exists | Rect, Forest |
| `setupUtils()` | Per-scene extras assigned onto `this` (e.g. `this.mouse`) | Ascii, Shader |
| `setupScene()` | Configure the scene itself (background, fog) | — |
| `initWorld()` | Override to defer world construction | Flower |

```javascript
export class RectExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }

  setupCamera() {
    this.camera.perspectiveCamera.position.set(7.5, -9, 15);
  }
}
```

| Experience | Purpose |
|------------|---------|
| `ShaderExperience` | Main shader experiments (17+ shaders) |
| `SineExperience` | Sine wave point cloud visualization |
| `PointExperience` | 3D point cloud rendering |
| `ModelExperience` | GLTF model loading (Fox, Rat) |
| `RectExperience` | Scrolling ribbon groups (Ryoji Ikeda-inspired) |
| `FlowerExperience` | GPGPU particle flowers |
| `ForestExperience` | Tiled flower grid, camera fitted to the grid |
| `PortalExperience` | Baked portal model with firefly particles |
| `AsciiExperience` | Mouse-reactive ASCII character grid |

### The `experience` dependency

Scene objects receive the **experience** and read what they need one level
deep. This mirrors the Three.js Journey access shape (`this.experience.scene`)
without its singleton, which does not suit this app's multi-scene
mount/unmount lifecycle.

```javascript
export class Ribbon {
  constructor({ experience, ribbonParams }) {
    this.scene = experience.scene;
  }
}
```

Two rules keep this legible:

1. **Never reach through another object.** `world.someExperience.debug` is a
   chain that hides the real dependency; `experience.debug` is one hop.
2. **The first few lines of a constructor are the complete dependency list.**
   Grabbing something from deep in a method hides it.

`shaderTestWorld` is the deliberate exception: its shaders are World-scoped
plugins that need sibling objects (`environment`, `helpers`), so they still
receive `world` — but reach the experience through a single `world.experience`
spelling.

### Teardown

`BaseExperience.destroy()` unsubscribes `resize`, `tick` and `resources.ready`,
cancels the animation frame, calls `world.destroy?.()`, disposes the scene,
controls, renderer and debug UI.

Any World that builds children inside `resources.on('ready')` **must** define
`destroy()`. Without it, leaving the route before loading finishes lets the
callback fire post-teardown and construct objects — and lil-gui folders — into
an already-disposed scene.

### Core Utilities (`world/utils/`)

| Class | Purpose |
|-------|---------|
| `Time` | Animation loop with `tick` events, delta time tracking |
| `Sizes` | Responsive canvas dimensions, pixel ratio |
| `Mouse` | NDC mouse position, raycasting for 3D interaction |
| `Debug` | lil-gui panel for real-time parameter tweaking |
| `EventEmitter` | Pub/sub event system for loose coupling |
| `Resources` | Async asset loading (GLTF, HDR, textures) with progress |
| `Helpers` | Debug helpers (axes, grid) |

### Shader Implementations (`world/shaderTestWorld/`)

17+ shader experiments registered in `shaderConfig.js`:

- **BasicShader** - Wave displacement shader
- **Galaxy** - Particle galaxy
- **Waves** - Water waves
- **Earth** - Earth with atmosphere
- **Fireworks** - Particle fireworks
- **Halftone** - Halftone effect
- **Hologram** - Holographic effect
- **CoffeeSmoke** - Baked model + particles
- **LeePerry** - Displacement shader on model
- **ParticleAnimation** - GPU particle system
- **ParticleMorph** - Morphing particles
- **GppuFlowField** - GPGPU flow field
- **ProceduralTerrain** - Procedural terrain
- **WobblySphere** - Wobbly sphere effect
- **SlicedModel** - Slicing effect
- **LightingBasics** - Basic lighting
- **PostProcessing** - Post-processing effects

### GLSL Shaders (`world/shaderTestWorld/shaders/`)

Organized by effect:
- `basic/`, `galaxy/`, `earth/`, `water/`, `fireworks/`
- `halftone/`, `holographic/`, `coffeeSmoke/`
- `particles/`, `morphingParticles/`, `gppuFlowField/`, `terrain/`
- `includes/` - Shared GLSL functions

---

## p5.js World Architecture

The p5.js implementation uses a functional sketch pattern integrated with React.

### Integration Flow

```
┌─────────────────────────────────────┐
│           React Page                │  ← P5Page.jsx
├─────────────────────────────────────┤
│         useP5World Hook             │  ← Manages p5 instance lifecycle
├─────────────────────────────────────┤
│           Setup Class               │  ← Wrapper (setup, draw, windowResized)
├─────────────────────────────────────┤
│         World Class                 │  ← Sketch implementation
└─────────────────────────────────────┘
```

### Hook: `useP5World.jsx`

React hook that manages p5.js instance lifecycle:
- Creates Setup wrapper with WorldClass
- Handles cleanup on unmount

```javascript
export function useP5World(WorldClass, options = {}, dependencies = []) {
  // Creates Setup wrapper with WorldClass
  // Handles cleanup on unmount
}
```

### Setup Wrapper: `src/p5/Setup.js`

```javascript
export class Setup {
  constructor(WorldClass, parent) {
    this.p5Instance = new p5(this.sketch.bind(this), parent);
    this.world = new WorldClass(p, width, height);
  }
  // Manages p5 lifecycle: setup(), draw(), windowResized()
}
```

### Sketch Implementations (`src/p5/`)

| Sketch | Description |
|--------|-------------|
| `Ryoji.js` | Audio-reactive grid visualization (Ryoji Ikeda-inspired) |
| `AudioInput.js` | Web Audio API wrapper with FFT, beat detection |
| `AdaptivePrecision.js` | Interactive cursor tracking demo |
| `Walker.js` | Basic walker (placeholder) |

---

## World Interaction

The Three.js and p5.js worlds are **completely separate**:

- **Separate React Routes**: Each runs in its own page via React Router
- **Shared Utilities**: Both use the same `Time` class from `world/utils/Time.js` for potential sync
- **Different Rendering Contexts**:
  - Three.js: WebGL via `<canvas>` element
  - p5.js: Canvas 2D or WebGL mode via p5 instance

### Communication Pattern

Events flow through `EventEmitter`:
```
Experience → World → Objects
     ↓
  Events (loadstart, loadcomplete)
     ↓
  React UI (LoadingBar)
```

---

## Entry Points

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry - mounts app with Router |
| `src/App.jsx` | Routes: Home, Shader, SineWave, PointCloud, AnimalRender, P5, AdaptivePrecision |
| `src/hooks/useWorld.jsx` | Three.js Experience wrapper |
| `src/hooks/useP5World.jsx` | p5.js Setup wrapper |
| `world/shaderTestWorld/ShaderExperience.js` | Main shader controller |
| `world/shaderTestWorld/shaderConfig.js` | Shader registry |

---

## Technology Stack

- **React 19** + React Router 7
- **Three.js 0.180** - 3D rendering
- **p5.js 2.2** - Creative coding
- **Vite 7** - Build tool
- **Tailwind CSS 3.4** - Styling
- **lil-gui** - Debug panel
- **GLSL** - Custom shaders via vite-plugin-glsl
