# Resources (`world/utils/Resources.js`)

Batch asset loader, driven by a manifest array. `extends EventEmitter` (see [event-emitter.md](event-emitter.md)).

## Manifest format (`world/sources/sources.js`)

A single flat array shared across every scene that needs assets:

```js
{ name: "foxModel", type: "gltfModel", path: "/static/models/Fox/glTF/Fox.gltf" }
```

Supported `type` values, each dispatched to a specific loader in `Resources.startLoading()`:

| `type` | Loader |
|---|---|
| `"gltfModel"` | `GLTFLoader` (with `DRACOLoader`, decoder path `/static/draco/`) |
| `"texture"` | `TextureLoader` |
| `"hdrTexture"` | `RGBELoader` |
| `"cubeTexture"` | `CubeTextureLoader` (`path` is an array of 6 face URLs) |
| `"textureArray"` | Repeated `TextureLoader.load()` over an array of paths, resolved into an ordered array |

The manifest currently lists ~28 sources: cube-map env textures, HDRs, GLTF/GLB models (fox, rat, flower, LeePerrySmith, coffee smoke, portal, gears, DamagedHelmet, ship, procedural terrain test cubes), and various PBR texture sets.

## Lifecycle

```js
constructor(sources) {
  this.items = {};
  this.toLoad = sources.length;
  this.loaded = 0;
  this.setLoaders();
  this.startLoading();
}
```

- `startLoading()` iterates `sources` and dispatches each to the matching loader. On a load error it logs and still calls `sourceLoaded` with a `null` payload, so a single bad asset can't hang the whole batch.
- `sourceLoaded(source, file)` stores `this.items[source.name] = file`, increments `loaded`, and once `loaded === toLoad` fires `trigger('ready')`.

## Consuming loaded assets

Once `'ready'` fires, `items` is a flat `name -> asset` map. Object classes read the keys they need directly:

```js
// world/animalWorld/Fox.js
this.resource = this.world.resources.items.foxModel;
```

```js
// world/animalWorld/Rat.js
// reads ratModel, ratDiffTexture, ratNormalTexture, ratARMTexture
```

```js
// world/portalWorld/Portal.js
// reads portalModel, portalMap
```

```js
// world/flowerWorld/Flower.js
this.model = this.resources.items.flowerModel;
```

## Real `Resources` vs. stub `EventEmitter`

A scene's `World` constructor takes one of two paths:

- **Real loading** — `new Resources(sources)` (full manifest, or filtered — e.g. `FlowerExperience.js` filters down to just `flowerModel` before constructing `Resources`), then defers scene construction:
  ```js
  this.resources.on("ready", () => {
    // instantiate object classes that need loaded assets
  });
  ```
  Used by: `portalWorld`, `animalWorld`, `shaderTestWorld` (in its `World`, not its `Experience`), `flowerWorld`.

- **Stub `EventEmitter`** — `this.resources = new EventEmitter()`, used purely to keep the constructor signature consistent across scenes even though nothing is ever loaded or triggered. Used by scenes with no external assets: `rectPerception`, `pointCloudWorld`, `sineWorld`, `asciiWorld`, and `shaderTestWorld`'s `Experience` itself (its `World` swaps in the real `Resources`).

If you're adding a new scene, check whether it needs external assets before deciding which path to take — the stub keeps the constructor shape identical, so switching later is a small change, not a rewrite.

See [index.md](index.md) for the wider architecture this fits into.
