# Tile Field — implementation plan

Replaces `world/forestWorld/` (slug `forest`) with `world/tileFieldWorld/` (slug
`tiles`). See [README.md](README.md) for the decoded reference and credits.

Settled decisions: port the mechanic rather than a persistent hover-reveal; all
band evaluation on the GPU; retune the bands rather than match p5's noise;
`perlinClassic3D`; orthographic camera opt-in with perspective staying the
default; no raycast; data-driven rule array; over-allocated instances; plain
numeric params with a single uniform-write choke point for later audio work.

## Rule shape

The six rules generalise to one uniform set. Rules 4–6 bound the raw field on one
side and the cursor-modulated field on the other, so the cursor gains are per
comparison, not per rule:

```
low  = value - jGain.x * j + lGain.x * L
high = value - jGain.y * j + lGain.y * L
draw if low > band.x && high < band.y
```

| Rule | field | band | jGain | lGain |
|------|-------|------|-------|-------|
| 1 | 0 | `(0.41, 0.52)` | `(0, 0)` | `(1, 1)` |
| 2 | 0 | `(-1, 0.30)` | `(0, 1)` | `(0, 0)` |
| 3 | 1 | `(0.64, 0.72)` | `(0, 0)` | `(1, 1)` |
| 4 | 0 | `(0.71, 0.84)` | `(0.25, 0)` | `(0, 0)` |
| 5 | 1 | `(0.25, 0.32)` | `(0, 1)` | `(0, 0)` |
| 6 | 1 | `(0.72, 0.85)` | `(0, 0)` | `(0, 0.1667)` |

These are the original's values, carried over as **starting points only** — the
band bounds get retuned in Phase 7 against single-octave Perlin. Each rule also
carries `texture`, `offset` (sub-cell, in cell units) and `size`.

## Files

```
world/tileFieldWorld/
  TileFieldExperience.js
  World.js
  TileField.js
  tileFieldConfig.js              rule array + global defaults
  utils/tileFieldHelpers.js
  utils/tileFieldHelpers.test.js
  shaders/tileField/vertex.glsl
  shaders/tileField/fragment.glsl
  shaders/includes/perlinClassic3D.glsl   copied from shaderTestWorld
  README.md
  PLAN.md
```

## Phases

Each phase should end with the scene in a runnable state.

### Phase 1 — Orthographic camera support

`world/objects/Camera.js` gains `type = "perspective"` and, for
`"orthographic"`, a `frustumHeight` option; it builds an `OrthographicCamera`
with `left/right` derived from `sizes.aspect` and keeps `resize()` correct for
both. `perspectiveCamera` stays the property name the rest of the repo reads
(renaming it touches every scene — not worth it here), with a note in the header
comment that it holds whichever camera type was requested.

Risk: `BaseExperience`, `Renderer`, `AudioSource` and `FlowerTextGrid` all reach
for `camera.perspectiveCamera`. Nothing changes for them while the default is
perspective. Verify by loading every existing scene before moving on.

### Phase 2 — Grid maths + tests

`utils/tileFieldHelpers.js`, pure and tested per the
`rectPerception/utils/rectWorldHelpers.test.js` pattern:

- `computeGridDimensions(...)` → `{ cellSizePx, cols, rows, frustumWidth, frustumHeight, capped }`.
  The frustum spans the cells that *fit* the viewport, while `cols`/`rows` are
  inflated past it by `bleed`. Tying the frustum to the inflated count instead
  frames the overflow, so the bleed vanishes and cells quietly shrink below the
  size `cellDivisor` asks for.
- `cursorToGridSpace(ndcX, ndcY, frustumWidth, frustumHeight)` → cursor in the
  same centred cell-unit space as the cells, y already flipped.
- `gridDiagonal(cols, rows)` → the length the cursor radii are fractions of.

**Only helpers on the render path are kept.** `cellCentre` and `cursorFalloff`
were planned as JS mirrors of the shader's maths, on the reasoning that a
half-tile centring error is miserable to eyeball. They were written, tested, and
then dropped: a JS reimplementation that nothing calls cannot catch an error in
the GLSL it parallels, so those tests passed while proving nothing. Cell
alignment stays eyeball-only, as the band logic does.

### Phase 3 — One static rule end to end

Olive background, textures loaded, one rule's mesh, noise in the vertex shader,
no cursor, no drift. Proves the geometry: sprites land on cell centres plus
offset, the grid bleeds past all four edges, and nothing is letterboxed.

- One `InstancedBufferGeometry` built from a `PlaneGeometry(1, 1)`'s attributes,
  shared by every rule; per-rule `size` and `offset` are uniforms. Not an
  `InstancedMesh`, as planned: the instances carry no per-instance matrix, so an
  `InstancedMesh` would upload a redundant `mat4` per cell *and* derive its
  culling bounds from those identity matrices — culling the whole grid.
- `InstancedBufferAttribute aCell (vec2)` allocated to `MAX_COLS * MAX_ROWS`
  (160 × 160 = 25600), rewritten on rebuild, `instanceCount = cols * rows`.
- Vertex: cell centre in cell units = `aCell + offset + size/2`, shifted by
  `-cols/2` / `-rows/2` and y-flipped; noise
  `remap(perlinClassic3D(vec3(aCell * freq, z)), -1, 1, valueMin, 1)`;
  band test; on a miss `gl_Position = vec4(0.0, 0.0, 2.0, 1.0)` so it clips.
- Fragment: sample the sprite, `discard` below an alpha threshold.
  `transparent: true`, `depthWrite: false`.
- Load only the tile textures: `new Resources(sources.filter(...))` instead of the
  whole `sources` list, which currently drags in every model and HDR in the repo
  for a scene that needs six PNGs.
- `valueMin` (the original's `0.15`) is a uniform, not baked in.

### Phase 4 — Data-driven rules

`tileFieldConfig.js` exports the rule array; `TileField` maps it to one
mesh + `ShaderMaterial` each, sharing the one geometry, with `renderOrder = index` so later
rules paint over earlier ones as in the original. All six rules live, including
the two sprites the original never draws being one array entry away.

### Phase 5 — Cursor

`Mouse` gains, additively so no existing scene changes behaviour: a
`pointerleave` trigger, and a `touchmove` handler feeding the same
`updatePosition` (`mousemove` alone leaves the influence frozen during a touch
drag). `TileField` converts NDC to grid space and writes one `uCursor` uniform.
On leave, the cursor goes far off-grid so the field relaxes to undisturbed rather
than freezing where the pointer left — the original freezes, which reads as a bug.

### Phase 6 — Cadence

`stepMs` (default ~67ms for the original's 15Hz) gates the field/cursor uniform
updates; `holdMs` (2500) keeps the field static on entry, matching the original's
`noLoop`/`loop`; `zSpeed` advances each field's drift. The renderer keeps running
at 60fps — only the uniforms are throttled.

The original's `z` also creeps *across* columns (its `w += N` sits inside the
column loop), a sub-`1e-5` skew. Not ported; noted in case the field ever looks
suspiciously uniform by comparison.

### Phase 7 — Debug panel, then tune

One folder per rule (band min/max, the two cursor gain pairs, sprite selector,
offset, size) plus a globals folder (cell divisor, `zSpeed` per field, noise
frequency per field, `valueMin`, cursor radii and magnitudes, `stepMs`,
`holdMs`, background). A **copy params as JSON** button dumps current state to
the clipboard for pasting back into `tileFieldConfig.js`.

Then the actual work: retune six band pairs against single-octave Perlin. The
panel is the only tool for this, since the band logic is in GLSL and cannot be
unit tested — build it before tuning, not after.

All uniform writes go through a single `applyParams()` so the later audio step
has one place to modulate.

### Phase 8 — Resize, teardown, cleanup

- Debounced resize: recompute dimensions, rewrite `aCell`, set `instanceCount`
  and grid uniforms. No disposal, no reallocation.
- Real `destroy()`: remove meshes, dispose the one geometry and the six
  materials, destroy debug folders, drop listeners. Textures belong to
  `Resources`, so they stay. (`forestWorld/World.js` currently calls
  `this.forest?.destroy?.()` against a method that was never written.)
- Delete `world/forestWorld/`; update `experienceConfig.js` to slug `tiles`,
  name "Tiles", pointing at `TileFieldExperience`. Fix the stale
  `forestWorld/ — Tiled flower grid` rows in `docs/architecture.md`.
- `npm run lint` and `npx vitest run` clean.

## Deferred

- **Audio-driven bands.** `AudioSource` already does band/threshold/trigger work
  for the Ryoji scene; the hook is `applyParams()`.
- **Per-tile transitions.** Impossible statelessly — a shader cannot know how
  long a cell has been visible. Needs a ping-pong progress texture, which is a
  design change, not an addition.
- **Persistent hover-reveal** as a second mode over the same field.
- **Keyword text layer.** The original scatters ~18 SVG labels with collision
  rejection, fading each in within 200px of the cursor.
