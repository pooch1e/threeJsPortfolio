# EventEmitter (`world/utils/EventEmitter.js`)

A small pub/sub base class that nearly every "driver" class in `world/` extends. It's the mechanism the whole render-loop and asset-loading pattern is built on.

## API

- `on(_names, callback)` — registers `callback` against one or more event names. Names can be space/comma/slash-separated, and can carry a `.namespace` suffix (e.g. `'move.ascii'`) so multiple listeners on the same base event can later be removed independently. Returns `this` (chainable).
- `off(_names)` — removes listeners matching the given name(s)/namespace(s).
- `trigger(_name, _args)` — fires every callback registered against `_name`, passing `_args` (an array) as call arguments. Returns the last callback's return value.

`EventEmitter` has no events of its own — it's a pure mechanism. `Time`, `Sizes`, `Mouse`, `Resources`, and one scene's `World` (see below) each subclass it to define their own domain events.

## Classes that `extends EventEmitter`

| Class | Emits | Typical listeners |
|---|---|---|
| `Time` (`world/utils/Time.js`) | `'tick'` — every `requestAnimationFrame` | every `*Experience.update()` |
| `Sizes` (`world/utils/Sizes.js`) | `'resize'` — on construction, and on `window`'s `resize` | every `*Experience.resize()` |
| `Mouse` (`world/utils/Mouse.js`) | `'click'`, `'move'` — each with `[position, event]` | `Ascii` (ripple effect), shader objects with pointer interaction |
| `Resources` (`world/utils/Resources.js`) | `'ready'` — once every manifest source has resolved | `World` constructors that need loaded assets before building scene content |
| `world/shaderTestWorld/World.js` | `'loadstart'`, `'loadcomplete'` — each with `[{ shaderKey }]`, fired during `loadPractice(key)` | shader-switch UI (loading state while swapping demos) |

## The render loop, end to end

This is the backbone every scene relies on:

```
Time.tick()  ──trigger('tick')──▶  Experience.update()
                                        ├─ camera.update()      (OrbitControls damping)
                                        ├─ renderer.update()    (renderer.render(scene, camera))
                                        └─ world.update(time)   ──▶ leaf object .update(time) methods
```

and, in parallel:

```
Sizes (window resize)  ──trigger('resize')──▶  Experience.resize()
                                                     ├─ camera.resize()
                                                     └─ renderer.resize()
```

Every `*Experience` constructor wires these up the same way:

```js
this.sizes.on("resize", () => this.resize());
this.time.on("tick", () => this.update());
```

## Composition vs. inheritance

Scenes that don't load external assets still need a `resources` object for constructor-signature consistency across scenes — they use a bare `new EventEmitter()` instead of the real `Resources` class (see [resources.md](resources.md) for when each is used). This is composition, not inheritance: those Experience classes don't extend `EventEmitter` themselves, they just hold an instance of one.

See [index.md](index.md) for the wider architecture this fits into.
