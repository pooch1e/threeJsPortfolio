/**
 * Composition root for the Ryoji scene. Packs a row of ribbon groups across
 * x, each group sampling one of three presets, then drives their scroll.
 */
import { Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { WAVE_TYPES } from "../utils/Wave";
import { randomFloat, randomElement} from "../../utils/helpers";
import { computeGroupOffsets, createGroupSpecs } from "./utils/rectWorldHelpers";

export class World {
  constructor(experience) {
    this.experience = experience;
    this.debug = experience.debug;
    this.scene = experience.scene;

    this.scene.background = new Color("white");

    // TODO HOMEWORK:
    // Reverse direction speeds

    // Ribbon Group Parameters
    const ribbonGroupCount = 15; // amount of groups
    const groupGap = 0.15; // lower this for lower gap between groups
    const spacing = 0.05; // space between individual ribbons in a group
    const xWidth = 0.5;

    const groupSpecs = createGroupSpecs(ribbonGroupCount, xWidth, spacing)
    const centeredGroupOffsets = computeGroupOffsets(groupSpecs, groupGap)

    this.ribbonGroups = Array.from(new Array(ribbonGroupCount)).map(
      (_, index) => {
        const ribbonGroupTypes = {
          tight: {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(0.1, 0.3),
            heightMax: randomFloat(0.2, 1),
            yGapScale: randomFloat(0.05, 0.1),
          },
          middle: {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(1, 2),
            heightMax: randomFloat(3, 5),
            yGapScale: randomFloat(0.5, 1),
          },
          sparse: {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(2, 3),
            heightMax: randomFloat(4, 6),
            yGapScale: randomFloat(2, 3),
          },
        };

        const ribbonGroupConfig = {
          label: `Ribbons - ${index}`,
          spacing,
          xWidth,
          ...randomElement(Object.values(ribbonGroupTypes)),
          ribbonCount: groupSpecs[index].ribbonCount,
          groupXOffset: centeredGroupOffsets[index],
          xGapScale: 0.2,
          planeCount: 20,
          wave: {
            type: randomElement(Object.keys(WAVE_TYPES)),
            frequency: randomFloat(0.03, 0.07),
            amplitude: randomFloat(0.2, 0.6),
            phase: randomFloat(0, Math.PI * 2),
          },
        };

        return new RibbonGroup({ experience, groupParams: ribbonGroupConfig });
      },
    );
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
