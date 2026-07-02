# Scenes under `world/`

Eight scene directories exist under `world/` (excluding shared `world/objects/`, `world/utils/`, `world/sources/`), each following the [Experience → World → Objects pattern](experience-pattern.md).

1. **`rectPerception`** (route `/rects`) — `RectExperience` → `World` → `Ribbon`. Procedurally generated vertical "ribbons" of stacked planes arranged left-to-right; a perspective/orbit-camera study. No external assets.

2. **`pointCloudWorld`** (route `/pointCloud`) — `PointExperience` → `World` → `Point`. A `Points` cloud (1000 pts) perturbed with Perlin/Improved noise, plus a randomly-reconnecting `LineSegments` network; animates by oscillating point Y positions and rewiring line endpoints each tick. No external assets.

3. **`portalWorld`** (route `/portalblend`) — `PortalExperience` → `World` (real [`Resources`](resources.md)) → `Portal`. Loads a baked "portal" GLTF model + baked texture, adds an `RectAreaLight`, and a custom-shader `Points` "fireflies" effect.

4. **`asciiWorld`** (route `/ascii`) — `AsciiExperience` (adds `Mouse` + `stats.js` FPS panel) → `World` → `Ascii`. Full-screen shader effect rendering a grid of glyphs (ASCII-art look) via a `DataTexture` glyph atlas and custom GLSL, with mouse-driven ripple interaction.

5. **`shaderTestWorld`** (route `/shaders`) — `ShaderExperience` (adds `Mouse` + `stats.js`) → `World extends EventEmitter` → dynamically-loaded "shader practice" modules. `World` uses `shaderConfig.js` (registry key → dynamic `import()`) covering ~16 mini demos: basic, waves, galaxy, Lee Perry Smith, coffee smoke, hologram, fireworks, lighting basics, halftone, earth, particles animation, morphing particles, GPGPU flow field, wobbly sphere, procedural terrain, sliced model, post-processing. `loadPractice(key)` swaps the active shader class at runtime, emitting `'loadstart'`/`'loadcomplete'` (see [event-emitter.md](event-emitter.md)) and disposing the previous shader's mesh/geometry/material. Effectively a sub-router of many WebGL/GLSL demos inside one scene.

6. **`animalWorld`** (route `/animalPage`) — `ModelExperience` → `World` (real `Resources`, full manifest) → `Floor`, `Fox`, `Rat`, `Environment`. Loads fox and rat GLTF models + PBR textures, sets up a circular grass floor and sunlight/environment map, animates the fox via `AnimationMixer` (idle/walking/running crossfades).

7. **`flowerWorld`** (route `/flower`) — `FlowerExperience` (loads only `flowerModel`, filtered from the shared manifest) → `World` → `FlowerField` (GPGPU-based flower/particle field via `GPUComputationRenderer` and custom GLSL, using the `flowerModel` GLTF as base geometry) + `FlowerDataScroll` (scroll-driven companion object).

8. **`sineWorld`** (route `/sineWave`) — `SineExperience` (black background, stub `EventEmitter` resources) → `SineWorld` (note: default export, not named `World` like the others) → `SinePoints` (a `Points`-based sine-wave visualization).

See [index.md](index.md) for the top-level overview.
