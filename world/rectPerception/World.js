import { Mesh, BoxGeometry, MeshBasicMaterial, Color } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { WAVE_TYPES } from "../utils/Wave";
import { randomFloat, randomElement, randomInt} from "../../utils/helpers";

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
      worldRibbonCount: 1,
    };

    // TODO: random ribbonCount per group — sketch of the fix
    //
    // Right now groupXOffset = index * groupSpacing assumes every group has
    // the same width (worldRibbonCount is a single shared number). Once each
    // group gets its own random ribbonCount, groups have different widths,
    // so position can no longer be "index * uniform slot width" — it has to
    // be a running total of everything placed before it. That means two
    // passes: decide widths first, then accumulate positions.
    //
    // 1. Pick a spacing/xWidth up front (already fixed values below) and a
    //    fixed gap to leave between groups, e.g. const groupGap = 0.5.
    //
    // 2. Build a plain array of per-group specs BEFORE creating RibbonGroups,
    //    so widths are known ahead of the position pass:
    //      const groupSpecs = Array.from({ length: ribbonGroupCount }).map(() => {
    //        const ribbonCount = randomInt(minRibbons, maxRibbons); // new helper
    //        const width = (xWidth + spacing) * ribbonCount;
    //        return { ribbonCount, width };
    //      });
    //
    // 3. Walk the specs with a running cursor to get each group's left edge,
    //    then its center (this replaces groupSpacing/middleOffset math):
    //      let cursor = 0;
    //      const offsets = groupSpecs.map(({ width }) => {
    //        const center = cursor + width / 2;
    //        cursor += width + groupGap;
    //        return center;
    //      });
    //      const totalSpan = cursor - groupGap; // cursor overshoots by one gap
    //      const centeredOffsets = offsets.map((c) => c - totalSpan / 2);
    //
    // 4. .map over groupSpecs (zipped with centeredOffsets) to build the
    //    actual RibbonGroups, using spec.ribbonCount for ribbonCount and
    //    centeredOffsets[index] for groupXOffset — same as groupXOffset
    //    below, just sourced from the cursor pass instead of index * groupSpacing.
    //
    // Net effect: groupSpacing/middleOffset (computed per-index below) go
    // away entirely once this lands — they only make sense under the
    // uniform-width assumption.

    // Amount of singular ribbons in a group of ribbons
    const ribbonGroupCount = 15;
    const groupGap = 0.25; // groups sit flush against each other, no gap
    const spacing = 0.05;
    const xWidth = 0.5;

    // Pass 1: decide each group's ribbon count (and therefore its width)
    // before any positions are computed.
    const groupSpecs = Array.from({ length: ribbonGroupCount }).map(() => {
      const ribbonCount = randomInt(1, 5);
      const width = (xWidth + spacing) * ribbonCount;
      return { ribbonCount, width };
    });

    // Pass 2: walk the specs once with a running cursor to get each
    // group's left edge — RibbonGroup positions ribbon 0 directly at
    // groupXOffset and grows rightward, so groupXOffset must be a left
    // edge, not a center — then recenter the whole row around x=0.
    let cursor = 0;
    const offsets = groupSpecs.map(({ width }) => {
      const leftEdge = cursor;
      cursor += width + groupGap;
      return leftEdge;
    });
    const totalSpan = cursor - groupGap; // cursor overshoots by one gap
    const centeredOffsets = offsets.map((c) => c - totalSpan / 2);

    this.ribbonGroups = Array.from(new Array(ribbonGroupCount)).map(
      (_, index) => {
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
          ribbonCount: groupSpecs[index].ribbonCount,
          groupXOffset: centeredOffsets[index],
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
