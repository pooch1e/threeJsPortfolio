/**
 * Composition root for the Ryoji scene. Packs a row of ribbon groups across
 * x, each group sampling one of three presets, then drives their scroll.
 */
import { Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { RibbonWipe } from "./RibbonWipe";
import {
  computeGroupOffsets,
  createGroupSpecs,
  buildRibbonGroupConfig,
  hasIntervalElapsed,
} from "./utils/rectWorldHelpers";

/* Each sweep is an independent colour walking the ribbons, stepped by its own
   audio trigger — so they run concurrently off different parts of the mix. */
const SWEEPS = [
  { name: "beat", colour: "red", direction: 1, fallbackInterval: 400 },
  { name: "pulse", colour: "#DC2B2B", direction: -1, fallbackInterval: 900 },
];

export class World {
  constructor(experience) {
    this.experience = experience;
    this.debug = experience.debug;
    this.scene = experience.scene;

    this.scene.background = new Color("white");
    this.elapsedTime = 0;
    this.lastSweepAt = Object.fromEntries(SWEEPS.map(({ name }) => [name, 0]));
    this.warnOnUntriggeredSweeps();

    // Ribbon Group Parameters
    const ribbonGroupCount = 40; // amount of groups
    const groupGap = 0.01; // lower this for lower gap between groups
    const spacing = 0.02; // space between individual ribbons in a group
    const ribbonWidth = 0.2;

    const groupSpecs = createGroupSpecs(ribbonGroupCount, ribbonWidth, spacing)
    const centeredGroupOffsets = computeGroupOffsets(groupSpecs, groupGap)

    this.ribbonGroups = groupSpecs.map((spec, index) => {
      return new RibbonGroup({
        experience, groupParams: buildRibbonGroupConfig({
          index,
          ribbonCount: spec.ribbonCount,
          groupXOffset: centeredGroupOffsets[index],
          spacing,
          ribbonWidth
        })
      })
    })

    // sweeps walk a per-group index, so a group of 2 and a group of 15 advance
    // at different screen rates — the wipe crosses the scene as one line, which
    // needs every ribbon in a single left-to-right address space instead
    this.ribbonsByX = this.ribbonGroups
      .flatMap((group) => group.ribbons)
      .sort(
        (a, b) => a.ribbonParams.ribbonXPos - b.ribbonParams.ribbonXPos,
      );

    this.ribbonWipe = new RibbonWipe({
      ribbons: this.ribbonsByX,
      debug: this.debug,
      onStart: () => this.suspendSweeps(),
      onFinish: () => this.resumeSweeps(),
    });
  }

  // a sweep whose name matches no trigger falls back to its timer and keeps
  // running, so a typo here looks like working code that just ignores the music
  warnOnUntriggeredSweeps() {
    const audio = this.experience.audio;
    if (!audio) return;

    const missing = SWEEPS.filter(({ name }) => !audio.triggers[name]);
    if (missing.length === 0) return;

    console.warn(
      `Ryoji sweeps with no matching audio trigger: ${missing
        .map(({ name }) => name)
        .join(", ")}`,
    );
  }

  suspendSweeps() {
    this.ribbonGroups.forEach((group) => group.clearSweeps());
  }

  // the fallback timers keep running while the wipe holds the scene, so without
  // rearming them every suspended sweep steps once the instant it resumes
  resumeSweeps() {
    SWEEPS.forEach(({ name }) => {
      this.lastSweepAt[name] = this.elapsedTime;
    });
    this.ribbonGroups.forEach((group) => group.repaintSweeps());
  }

  update(time) {
    this.elapsedTime = time.elapsedTime;
    this.ribbonGroups.forEach((group) => group.update(time));

    this.ribbonWipe.update(time);
    if (this.ribbonWipe.active) return;

    SWEEPS.forEach((sweep) => {
      if (!this.consumeSweepStep(sweep, time)) return;

      this.ribbonGroups.forEach((group) =>
        group.stepSweep(sweep.name, sweep),
      );
    });
  }

  consumeSweepStep(sweep, time) {
    const audio = this.experience.audio;
    const trigger = audio?.triggers?.[sweep.name];

    // audio only unlocks on a user gesture, so the timer covers the scene
    // until the track is actually running
    if (trigger && audio.isPlaying) return trigger.fired;

    if (
      !hasIntervalElapsed(
        time.elapsedTime,
        this.lastSweepAt[sweep.name],
        sweep.fallbackInterval,
      )
    ) {
      return false;
    }

    this.lastSweepAt[sweep.name] = time.elapsedTime;
    return true;
  }

  destroy() {
    this.ribbonWipe.destroy();
    this.ribbonGroups.forEach((group) => group.destroy());

    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
