/**
 * Composition root for the Ryoji scene. Packs a row of ribbon groups across
 * x, each group sampling one of three presets, then drives their scroll.
 */
import { Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
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
  { name: "pulse", colour: "#1fbf6b", direction: -1, fallbackInterval: 900 },
];

export class World {
  constructor(experience) {
    this.experience = experience;
    this.debug = experience.debug;
    this.scene = experience.scene;

    this.scene.background = new Color("white");
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

  update(time) {
    this.ribbonGroups.forEach((group) => group.update(time));

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
    this.ribbonGroups.forEach((group) => group.destroy());

    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
