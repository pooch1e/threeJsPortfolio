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
│   ├── objects/            # Camera, Renderer
│   ├── utils/              # Time, Sizes, Mouse, Debug, Resources, EventEmitter
│   ├── sources/            # Asset definitions
│   ├── shaderTestWorld/    # 17+ shader experiments
│   ├── sineWorld/          # Sine wave visualization
│   ├── pointCloudWorld/    # 3D point cloud
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

Each page has an Experience class that orchestrates the Three.js setup:

| Experience | Purpose |
|------------|---------|
| `ShaderExperience` | Main shader experiments (17+ shaders) |
| `SineExperience` | Sine wave point cloud visualization |
| `PointExperience` | 3D point cloud rendering |
| `ModelExperience` | GLTF model loading (Fox, Rat) |

```javascript
// Pattern from ShaderExperience.js
export class ShaderExperience {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.debug = new Debug(options.debug);
    this.sizes = new Sizes();      // Window resize handling
    this.time = new Time();        // Animation timing
    this.scene = new THREE.Scene();
    this.camera = new Camera({...});
    this.renderer = new Renderer({...});
    this.world = new World(this);  // Content layer
  }
}
```

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
