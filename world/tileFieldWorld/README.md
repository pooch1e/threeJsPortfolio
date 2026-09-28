# Tile Field

A grid of pixel-art sprites drawn where a Perlin noise field crosses a set of
threshold bands. The cursor offsets the noise value it reads, so the bands shift
locally around the pointer and the tiling reorganises into a clearing that
follows it.

## Credit

This scene is a port of the homepage of the **Center for Planetary Pedagogies**
(<https://www.centerforplanetarypedagogies.org/>), including its sprite set
(`C4PP_*.png`).

- Art direction — Michelle Kuan
- Identity — Amélie Lorente
- Website development — Studio OBV (<https://www.studio-obv.com/>)

The original is a p5.js sketch. This is an independent Three.js reimplementation
of the same idea, with its own noise and its own retuned constants.

## How the original works

Decoded from the original's page bundle
(`_next/static/chunks/app/page-*.js`), recorded here because it is the reference
this scene's constants were tuned against.

Background `#7A8922`. Cell size `m = windowWidth / 61` on desktop, a flat `18px`
below 768px. The canvas is created at **1.12× the viewport** so the grid runs off
every edge. Rows and columns are `height/m` and `width/m` — roughly 68 × 38
cells. `noLoop()` on setup, `loop()` after **2500ms**, then a pinned
`frameRate(15)`.

Two noise fields, re-evaluated for every cell every frame:

```
c[col][row] = map(noise(col*0.10, row*0.10, zA), 0,1, 0.15,1)
d[col][row] = map(noise(col*0.12, row*0.12, zB), 0,1, 0.15,1)
```

`zA` and `zB` advance by `5e-7` per column per frame (`1e-5` on mobile) — about
`3e-5` per frame in total, so the field is near-static with an imperceptible
creep.

The cursor does not reveal tiles. It produces two distance-based offsets applied
to the noise value before the threshold test:

```
j = map(dist(cursor, cellCentre), 0, dist(.05w,.05h,w,h), 0,    0.1)  // 0 at cursor, 0.1 far
L = map(dist(cursor, cellCentre), 0, dist(.15w,.10h,w,h), 0.05, 0  )  // 0.05 at cursor, 0 far
```

Six draw rules, tested per cell in this order, each with its own sub-cell offset
and size (`m` = cell size):

| # | Field | Condition | Sprite | Offset | Size |
|---|-------|-----------|--------|--------|------|
| 1 | c | `0.41 < c+L < 0.52` | Terrain DarkGreen | `m/3` | `0.95m` |
| 2 | c | `c-j < 0.30` | Triangle Blue | `m/2` | `0.90m` |
| 3 | d | `0.64 < d+L < 0.72` | Triangle Blue | `m/3` | `0.95m` |
| 4 | c | `c-j/4 > 0.71 && c < 0.84` | Flower DarkRed | `m` | `0.90m` |
| 5 | d | `d > 0.25 && d-j < 0.32` | Flower DarkRed | `m/2` | `0.90m` |
| 6 | d | `d > 0.72 && d+L/6 < 0.85` | Round LightGreen | `m/2` | `0.80m` |

Because `j → 0` at the cursor, rules 2 and 5 draw *less* near the pointer, and
rules 1, 3 and 6 have their bands shifted by `L` into different cells — together
reading as a disturbance travelling with the mouse. Rules 4, 5 and 6 bound the
raw field on one side and the modulated field on the other, which is why a rule
needs separate cursor gains for its lower and upper comparison.

`C4PP_Flower_Blue.png` and `C4PP_Flower_Red.png` are preloaded by the original
and never drawn.

Two details of the original are deliberately **not** ported: cells were skipped
inside `(y<0.1h && x<0.2w)` and `(x>0.7w && y<0.1h)` to keep its logo and nav
legible, and the row loop started at index 2. This scene has no overlaid text, so
the field runs edge to edge.

## Architecture

```
TileFieldExperience  orthographic camera, olive background, tile textures only
  └── World          owns params, builds TileField once resources are ready
        └── TileField  one InstancedMesh per rule, all sharing one PlaneGeometry
```

The grid lives in **cell units**: the orthographic frustum is sized so one world
unit is exactly one cell, which makes the cursor-to-cell mapping plain
arithmetic (`utils/tileFieldHelpers.js`, unit tested).

Every rule is one `InstancedMesh` with one instance per cell, and its own
`ShaderMaterial` uniforms. The *vertex* shader evaluates the noise for its cell,
applies the cursor offsets, tests its band, and collapses the vertex behind the
far plane on a miss — so nothing about the field is recomputed in JavaScript and
the cursor is a single uniform write. `renderOrder` matches rule order, since the
original's later rules paint over earlier ones.

Instances are allocated once for a generous ceiling and resize only changes
`instanceCount` and the grid uniforms. Note that instances are **not** frustum
culled individually — an `InstancedMesh` is culled as a whole — so surplus
instances cost a vertex shader invocation each, which is why the band test lives
in the vertex stage.

## Tuning

The band constants here are **not** the original's. This scene uses a single
octave of `perlinClassic3D`, whereas p5's `noise()` is four octaves with 0.5
falloff, so the value distribution is much wider and the original's thresholds do
not transfer.

Everything is live in the debug panel (toggled from `ExperienceChrome`): per-rule band
bounds, cursor gains, sprite, offset and size; and globally the cell divisor,
z-drift speed, cursor radii and magnitudes, step interval, and background. The
panel's **copy params as JSON** button dumps the current state for pasting back
into the rule table as new defaults.
