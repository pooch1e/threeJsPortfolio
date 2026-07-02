# `world/` — Three.js architecture

Every scene under `world/` follows the same chain:

```
Page component → useWorld hook → *Experience class → World class → leaf object classes
```

An Experience owns the camera/renderer/scene and the core utilities (time, sizes, debug, resources). It hands itself to a `World`, which builds the scene's actual content out of leaf object classes.

For the broader project layout (React routing, p5.js sketches, tech stack), see [../architecture.md](../architecture.md). The docs below go deeper on specific subjects within `world/`:

| Doc | Covers |
|---|---|
| [experience-pattern.md](experience-pattern.md) | The full Page → Hook → Experience → World → Objects chain, traced file by file through one scene |
| [scenes.md](scenes.md) | All 8 scenes under `world/` and what each one renders |
| [event-emitter.md](event-emitter.md) | The pub/sub base class and how `Time`/`Sizes`/`Mouse`/`Resources` use it to drive the render loop |
| [resources.md](resources.md) | Asset manifest format and how scenes load GLTF/textures/HDRs |
| [debug.md](debug.md) | The `lil-gui` wrapper and the convention for exposing tweakable params |

Shared, non-scene-specific code lives in:

- `world/objects/` — `Camera`, `Renderer` (used by every Experience)
- `world/utils/` — `Time`, `Sizes`, `Mouse`, `Resources`, `Debug`, `EventEmitter`, `Helpers`
- `world/sources/sources.js` — the shared asset manifest
