# Debug (`world/utils/Debug.js`)

Thin wrapper around [`lil-gui`](https://lil-gui.georgealways.com/).

```js
export class Debug {
  constructor(enabled = false) {
    this.active = enabled;
    if (this.active) {
      this.ui = new GUI();
    }
  }
}
```

- `active` — boolean flag, `true` when the scene was constructed with `{ debug: true }`.
- `ui` — the `lil-gui` `GUI` instance. Only created (and only exists) when `active` is `true`.

There is no folder/preset abstraction on top of `lil-gui` — every consumer calls `lil-gui` methods directly on `debug.ui`.

## How a scene turns debug on

Every `*Experience` class does:

```js
this.debug = new Debug(options.debug);
```

`options.debug` is threaded down from the page component, typically read from a query param:

```js
// src/pages/RectPage.jsx
const debugMode = searchParams.get("debug") === "true";
const { canvasRef } = useWorld(RectExperience, { debug: debugMode }, []);
```

So visiting a scene route with `?debug=true` turns the panel on for that page load.

## How a class exposes its own params

Every `World`/object class that wants tweakable values follows the same shape:

1. Store tweakable values in a plain `this.params = { ... }` object in the constructor.
2. Build once using those params, then call `this.setDebug()`.
3. `setDebug()` guards everything behind `if (this.debug.active) { ... }` — nothing touches `debug.ui` when debug is off.
4. Add a folder: `this.debugFolder = this.debug.ui.addFolder('Name')`.
5. Bind each control to a `params` key: `.add(this.params, key).min().max().step().name().onChange(...)`. Colors use `.addColor(this.params, key)` instead of `.add`.
6. If changing the value requires regenerating geometry, `onChange`/`onFinishChange` calls a rebuild method rather than mutating in place; if it's a cheap material property, the callback mutates the live object directly (e.g. `this.material.size = this.params.size`).
7. On teardown, `destroy()` calls `this.debugFolder.destroy()` (guarded by `if (this.debugFolder)`) to remove the folder from the shared `GUI`.

Reference implementations: `world/pointCloudWorld/Point.js` (`setDebug()` ~line 190, `updateGeometry()` rebuild ~line 134) and `world/shaderTestWorld/Galaxy.js` (`setDebug()` ~line 130, `setShader()` rebuild ~line 29).

### `onChange` vs `onFinishChange`

- `onChange` fires on every slider tick — use for cheap updates (material color/size).
- `onFinishChange` fires once, on release — use when the callback triggers a full geometry rebuild (expensive), so dragging a slider doesn't rebuild on every intermediate value.

## Gotcha

`debug.ui` is a `GUI` instance, not a function — calling it as `this.debug.ui("Some Folder")` throws. Use `this.debug.ui.addFolder("Some Folder")`. Similarly, `lil-gui`'s `.add()` binds a specific object + property (`.add(this.params, 'count')`), not a raw value (`.add(this.params.count)` will not work as a live-editable control).

See [index.md](index.md) for how this fits into the wider Experience → World → Objects pattern.
