# Audio (`world/utils/AudioSource.js`)

Any scene can opt into a music track and drive its visuals from it — a continuous `level` for things that should breathe with the music, and named **triggers** that fire on the frame a frequency band crosses a threshold, for things that should step in time with it.

Nothing is scene-specific. A scene declares what it wants in one hook and reads two properties in its update loop.

```
audioOptions() → AudioSource → AnalyserNode → audioHelpers (pure maths) → world.update()
```

| File | Role |
|---|---|
| `world/utils/AudioSource.js` | Side-effecting class: loads the track, owns the Web Audio graph, updates per frame |
| `world/utils/audioHelpers.js` | Pure maths — normalising, smoothing, Hz→bin mapping, EQ curves, trigger state |
| `world/utils/AudioSpectrumDebug.js` | The live spectrum canvas in the debug panel |

---

## Turning it on

Add `audioOptions()` to your Experience. Returning anything non-null constructs `this.audio`; the default returns `null`, so scenes that don't want audio pay nothing.

```js
export class MyExperience extends BaseExperience {
  audioOptions() {
    return {
      path: "/static/audio/Principle.m4a",
      volume: 0.4,
    };
  }
}
```

`BaseExperience` handles the rest — construction after the camera exists, `update()` each frame before the world updates, and teardown. You never call `audio.update()` yourself.

### Options

| Option | Default | What it does |
|---|---|---|
| `path` | — | URL of the track, served from `public/static/audio/` |
| `loop` | `true` | Loop the track |
| `volume` | `0.5` | 0–1 |
| `fftSize` | `512` | Analyser resolution. Gives `fftSize / 2` bins spread linearly from 0 Hz to Nyquist (22050 Hz at 44.1 kHz), so 512 → 256 bins ≈ 86 Hz each |
| `smoothing` | `0.15` | How fast `level` chases the raw reading. 0 freezes it, 1 removes all damping |
| `smoothingTimeConstant` | `0.2` | Smoothing *inside* the AnalyserNode. See the gotcha below |
| `triggers` | `{}` | Named band triggers — see below |
| `autoplay` | `true` | Start on the first user gesture |

---

## Driving a visual from `level`

`audio.level` is a smoothed 0–1 number, available every frame. The idiom is to treat it as a multiplier, and to keep a base value around so the visual has something to return to.

```js
export class World {
  update(time) {
    const level = this.experience.audio?.level ?? 0;

    this.blob.mesh.scale.setScalar(1 + level * 0.5);
    this.blob.material.uniforms.uIntensity.value = level;
    this.blob.mesh.rotation.y += time.deltaTime * 0.001 * (1 + level * 3);
  }
}
```

The `?? 0` matters. Audio is optional and only unlocks after a user gesture, so a scene should look correct at `level === 0` rather than assume audio is present and running.

Reach for `level` when the visual should respond *continuously* — scale, brightness, speed, shader uniforms.

---

## Driving a visual from a trigger

Triggers are for things that should happen *once*, on a beat or a hit. Declare them by name alongside the rest of the options:

```js
audioOptions() {
  return {
    path: "/static/audio/Principle.m4a",
    triggers: {
      beat:  { band: [2000, 8000], threshold: 0.35, holdMs: 120 },
      pulse: { band: [60, 250],    threshold: 0.55, holdMs: 300 },
    },
  };
}
```

Then read `fired` in your update loop. It is `true` for exactly one frame:

```js
update(time) {
  const audio = this.experience.audio;

  if (audio?.triggers.beat.fired) this.flashPanel();
  if (audio?.triggers.pulse.fired) this.advanceStripe();
}
```

Triggers are independent, so **concurrent audio-driven effects come for free** — declare as many as you like on different parts of the spectrum and each drives its own thing.

### Trigger options

| Option | Default | What it does |
|---|---|---|
| `band` | — | `[lowHz, highHz]` to watch |
| `threshold` | — | 0–1 level the band must cross to fire |
| `releaseThreshold` | `threshold * 0.7` | Must fall back below this before it can fire again |
| `holdMs` | `0` | Minimum gap between fires |
| `eq` | `[]` | Analysis-only EQ — see below |
| `colour` | auto | Swatch used to identify it in the debug panel |

### Trigger properties, per frame

| Property | Meaning |
|---|---|
| `fired` | `true` on the single frame it crossed the threshold |
| `level` | Current 0–1 reading of its band, after EQ |
| `fireCount` | Total fires since the scene loaded |
| `armed` | `false` while waiting to fall back below `releaseThreshold` |

### Why two thresholds

A plain `level > threshold` check fires *every frame* the level stays up, so one drum hit becomes thirty events. Two mechanisms prevent that:

- **Hysteresis** — after firing, the trigger disarms until the level drops under `releaseThreshold`. The gap between the two stops a level hovering right on the boundary from chattering.
- **`holdMs`** — a minimum gap in milliseconds, so one drawn-out hit can't read as several.

---

## Analysis EQ

Sometimes the sound you want is inside a band that also contains something louder. A trigger can carry its own EQ that shapes what it reads:

```js
beat: {
  band: [2000, 8000],
  threshold: 0.35,
  eq: [{ band: [2000, 3000], gain: 0.6 }],  // duck 2–3 kHz out of the reading
}
```

Gains below 1 cut, above 1 boost, and overlapping bands compound. Two important properties:

- **It is analysis-only.** The EQ shapes what the *trigger* reads, never what the listener hears. It costs one multiply per bin — no extra filter nodes, no second FFT.
- **It does not renormalise.** A 0.5 gain genuinely halves that bin's contribution to the band average rather than redistributing it, so a cut actually lowers the reading instead of just reshaping it.

---

## Tuning it: the debug panel

Load the scene with `?debug=true` and an **Audio** folder appears. Guessing band edges from a waveform you can't see is the slow way to do this; the panel shows you the spectrum instead.

- A live **spectrum canvas** — grey bars are the raw spectrum; each trigger's band is shaded in its colour and flashes when it fires.
- Inside each band, the bars are **redrawn EQ-weighted**, so you see what the trigger actually reads rather than the raw signal.
- A horizontal line marks the **threshold**, and a thicker bar marks the current **level**. When the level bar crosses the threshold line, it fires.
- Sliders for band edges, threshold, release, hold and each EQ gain — all live, no reload.
- **Fires** counts events. "Is it firing too often" is far easier to read as a number than to feel.

The workflow: watch where the sound you want spikes, drag the band onto it, then lower the threshold until it fires reliably and raise it until it stops firing on everything else.

Nothing in the panel is constructed when debug is off — `setDebug()` returns immediately, and no canvas is created or drawn.

---

## Cost

Per frame the analysis is one FFT read plus a few hundred loop iterations — around 20k simple operations a second, which is nothing next to rendering the scene. Memory for the analysis is a couple of KB.

**The decoded track dominates everything else.** `AudioLoader` fetches the whole file and decodes it to PCM before a single note plays — there is no streaming. Download size is whatever the file is; resident memory is `duration × sampleRate × channels × 4 bytes`, regardless of how well the file compresses.

The scene's 6-minute track went from 320 kbps stereo MP3 (14.4 MB, ~125 MB decoded) to mono AAC (3.2 MB, ~63 MB decoded). **Mono is the lever that matters** — it halves the decoded buffer, while the bitrate only affects the download. If you add audio to a scene, prefer mono and keep it short; the analysis code is free by comparison.

---

## Gotchas

**Audio starts locked.** Browsers suspend the `AudioContext` until a user gesture. `AudioSource` listens on the **window** for the first `pointerdown`, `keydown` or `touchend` and resumes then, but until that happens the analyser returns **all zeros** — `level` is 0 and no trigger fires. Design the scene to look right in that state, or give it a timed fallback:

```js
if (trigger && audio.isPlaying) return trigger.fired;
return this.hasTimerElapsed(time);
```

**Update order is load-bearing.** `BaseExperience.update()` calls `audio.update()` before `world.update()`, so `fired` is fresh when the world reads it. It is cleared on the next audio update, so a world updating first would see last frame's value.

**`AudioContext` is a module-level singleton in three.** Every scene shares one, so nodes leak across SPA navigation unless disconnected. `AudioSource.destroy()` disconnects the source, analyser and listener gain — if you extend the audio graph, disconnect what you add.

**three never sets `smoothingTimeConstant`.** The AnalyserNode default of 0.8 lowpasses the spectrum hard enough to flatten the transients triggers fire on, which is why `AudioSource` defaults it to 0.2. Raise it if you want `level` to feel smoother; lower it if triggers feel late.

**Bin width follows `fftSize`.** At `fftSize: 64` you get 32 bins ≈ 690 Hz each, far too coarse to isolate a narrow band. 512 is a reasonable floor for trigger work.

**A trigger name is just a string.** Reading `audio.triggers.beet` yields `undefined`, and code that falls back to a timer will keep running as though nothing is wrong. `world/rectPerception/World.js` warns on startup when a sweep names a trigger that doesn't exist.

---

## Worked example: `world/rectPerception/`

The Ryoji scene runs two concurrent sweeps, each a colour walking through the ribbons, stepped by its own trigger:

```js
const SWEEPS = [
  { name: "beat",  colour: "red",     direction: 1,  fallbackInterval: 400 },
  { name: "pulse", colour: "#1fbf6b", direction: -1, fallbackInterval: 900 },
];
```

Red steps forward off the track's high-frequency clicks; green steps backward off the low end. Each falls back to its own timer while audio is locked. `World.consumeSweepStep()` decides *when* to step and `RibbonGroup.stepSweep()` handles *what happens* — the split that lets the same visual run with or without audio.

See [index.md](index.md) for how this fits the wider Experience → World → Objects pattern, and [debug.md](debug.md) for the general `setDebug()` convention `AudioSource` follows.
