/**
 * Composition root for the Ryoji scene. Packs a row of ribbon groups across
 * x, each group sampling one of three presets, then drives their scroll.
 */
import { Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { computeGroupOffsets, createGroupSpecs, buildRibbonGroupConfig } from "./utils/rectWorldHelpers";

export class World {
  constructor(experience) {
    this.experience = experience;
    this.debug = experience.debug;
    this.scene = experience.scene;

    this.scene.background = new Color("white");

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

  update(time) {
    this.ribbonGroups.forEach((group) => group.update(time));
  }

  destroy() {
    this.ribbonGroups.forEach((group) => group.destroy());

    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
