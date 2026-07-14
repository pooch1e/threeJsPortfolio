import { Mesh, BoxGeometry, MeshBasicMaterial, Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { WAVE_TYPES } from "../utils/Wave";
import { randomFloat, randomElement } from "../../utils/helpers";

export class World {
  constructor(rectExperience) {
    this.rectExperience = rectExperience;
    this.debug = this.rectExperience.debug;
    this.scene = this.rectExperience.scene;
    this.resources = this.rectExperience.resources;

    this.scene.background = new Color("white");

    // TODO HOMEWORK:
    // RibbonGroup Random ribbon count per group
    // Oscilating colour across groups
    // Reverse direction speeds
    // Plane Spin along movement axis
    // random width ribbons within a group (consider calculations for group offset and ribbon x position)

    // Owns params on how many ribbon group/ where they are placed in scene, how much space between each group
    this.worldParams = {
      spacing: 1,
      // TODO: make this random per group
      worldRibbonCount: 10,
    };

    // Amount of singular ribbons in a group of ribbons
    const ribbonGroupCount = 15;

    this.ribbonGroups = Array.from(new Array(ribbonGroupCount)).map(
      (_, index) => {
        const spacing = 0.05;
        const xWidth = 0.5;

        const groupSpacing =
          (xWidth + spacing) * this.worldParams.worldRibbonCount;

        const middleOffset =
          ((ribbonGroupCount - 1) / 2) * groupSpacing - groupSpacing / 2;

        const ribbonGroupTypes = [
          // TIGHT GROUP
          {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(0.1, 0.3),
            heightMax: randomFloat(0.2, 1),
            yGapScale: randomFloat(0.05, 0.1),
          },
          // MIDDLE GROUP
          {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(1, 2),
            heightMax: randomFloat(3, 5),
            yGapScale: randomFloat(0.5, 1),
          },
          // SPARSE GROUP
          {
            speedMin: randomFloat(0.8, 1.1),
            speedMax: randomFloat(3, 4),
            heightMin: randomFloat(2, 3),
            heightMax: randomFloat(4, 6),
            yGapScale: randomFloat(2, 3),
          },
        ];

        const ribbonGroupConfig = {
          label: `Ribbons - ${index}`,
          spacing,
          xWidth,
          ...randomElement(ribbonGroupTypes),
          ribbonCount: this.worldParams.worldRibbonCount,
          groupXOffset: index * groupSpacing - middleOffset,
          xGapScale: 0.2,
          planeCount: 20,
          wave: {
            type: randomElement(Object.keys(WAVE_TYPES)),
            frequency: randomFloat(0.03, 0.07),
            amplitude: randomFloat(0.2, 0.6),
            phase: randomFloat(0, Math.PI * 2),
          },
        };

        return new RibbonGroup({ world: this, groupParams: ribbonGroupConfig });
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
