/**
 * RibbonWipe — the interruption effect. On its own randomised schedule it holds
 * the scene still for a beat, then walks a single lit ribbon left to right
 * across the whole scene, one adjacent ribbon at a time like a chromatic run up
 * a keyboard, before handing the scene back. It paints ribbons directly, so it
 * is only safe to run while its owner has suspended anything else that paints —
 * World does that through onStart/onFinish.
 */
import { Color } from "three";
import { randomFloat } from "../../utils/helpers";
import { advanceWipePlayhead, wipeLitIndex } from "./utils/rectWorldHelpers";

const STATES = { IDLE: "idle", HOLD: "hold", RUN: "run" };

// the run's length is however long it takes to visit every ribbon, so the
// tunable is the dwell on each one rather than a total duration
const DEFAULTS = {
  colour: "red",
  holdMs: 220,
  stepMs: 22.5,
  minGapMs: 12000,
  maxGapMs: 25000,
};

export class RibbonWipe {
  constructor({ ribbons, debug, onStart, onFinish, ...options }) {
    this.ribbons = ribbons;
    this.debug = debug;
    this.onStart = onStart;
    this.onFinish = onFinish;

    this.params = { ...DEFAULTS, ...options };
    this.colour = new Color(this.params.colour);

    this.state = STATES.IDLE;
    this.litIndex = null;
    this.playheadIndex = 0;
    this.stepAccumulator = 0;
    this.elapsedTime = 0;
    this.phaseStartedAt = 0;
    // scheduled on the first update rather than here, because the scene's clock
    // has not started when the World constructor runs
    this.nextWipeAt = null;

    this.setDebug();
  }

  get active() {
    return this.state !== STATES.IDLE;
  }

  scheduleNext() {
    const { minGapMs, maxGapMs } = this.params;
    this.nextWipeAt =
      this.elapsedTime + randomFloat(minGapMs, Math.max(minGapMs, maxGapMs));
  }

  start() {
    if (this.active) return;

    this.state = STATES.HOLD;
    this.phaseStartedAt = this.elapsedTime;
    this.onStart?.();
  }

  finish() {
    this.restoreLit();
    this.state = STATES.IDLE;
    this.scheduleNext();
    this.onFinish?.();
  }

  update(time) {
    this.elapsedTime = time.elapsedTime;

    if (this.nextWipeAt === null) {
      this.scheduleNext();
      return;
    }

    if (this.state === STATES.IDLE) {
      if (this.elapsedTime >= this.nextWipeAt) this.start();
      return;
    }

    if (this.state === STATES.HOLD) {
      if (this.elapsedTime - this.phaseStartedAt < this.params.holdMs) return;

      this.startRun();
      return;
    }

    this.advance(time.deltaTime);
  }

  startRun() {
    this.state = STATES.RUN;
    this.playheadIndex = 0;
    this.stepAccumulator = 0;
    this.paintPlayhead();
  }

  advance(deltaTime) {
    const { index, accumulator } = advanceWipePlayhead(
      this.playheadIndex,
      this.stepAccumulator,
      deltaTime,
      this.params.stepMs,
    );

    this.stepAccumulator = accumulator;
    if (index === this.playheadIndex) return;

    this.playheadIndex = index;
    this.paintPlayhead();
  }

  paintPlayhead() {
    this.restoreLit();

    this.litIndex = wipeLitIndex(this.playheadIndex, this.ribbons.length);
    if (this.litIndex === null) {
      this.finish();
      return;
    }

    this.ribbons[this.litIndex].setColour(this.colour);
  }

  restoreLit() {
    if (this.litIndex === null) return;

    const ribbon = this.ribbons[this.litIndex];
    ribbon.setColour(ribbon.baseColour);
    this.litIndex = null;
  }

  setDebug() {
    if (!this.debug?.active) return;

    this.debugFolder = this.debug.ui.addFolder("Ribbon Wipe");

    const timing = { ribbons: this.ribbons.length, runSeconds: 0 };
    const refreshTiming = () => {
      timing.runSeconds = (this.ribbons.length * this.params.stepMs) / 1000;
    };
    refreshTiming();

    this.debugFolder.add({ fire: () => this.start() }, "fire").name("Fire Now");
    this.debugFolder.add(timing, "ribbons").name("Ribbons").disable();
    this.debugFolder
      .add(timing, "runSeconds")
      .name("Run (s)")
      .listen()
      .disable();
    this.debugFolder.add(this.params, "holdMs", 0, 1500, 10).name("Hold (ms)");
    this.debugFolder
      .add(this.params, "stepMs", 16, 250, 1)
      .name("Step (ms/ribbon)")
      .onChange(refreshTiming);
    this.debugFolder
      .add(this.params, "minGapMs", 500, 30000, 500)
      .name("Gap Min (ms)");
    this.debugFolder
      .add(this.params, "maxGapMs", 500, 60000, 500)
      .name("Gap Max (ms)");
    this.debugFolder
      .addColor(this.params, "colour")
      .name("Colour")
      .onChange((value) => this.colour.set(value));
  }

  destroy() {
    this.restoreLit();
    this.debugFolder?.destroy();
  }
}
