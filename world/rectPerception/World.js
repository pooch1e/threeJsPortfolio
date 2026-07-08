import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { RibbonGroup } from "./RibbonGroup";
import { WAVE_TYPES } from "../utils/Wave";

export class World {
  constructor(rectExperience) {
    this.rectExperience = rectExperience;
    this.debug = this.rectExperience.debug;
    this.scene = this.rectExperience.scene;
    this.resources = this.rectExperience.resources;

    this.worldParams = {
      spacing: 2,
      ribbonCount: 20,
    };

    this.xGapScale = 0.2;

    this.sharedParams = {
      yGapScale: 0.8,
      planeCount: 15,
      xWidth: 0.1,
    };

    const GROUP_SPACING = 8;
    const groupVariants = [
      { label: "RibbonsA", spacing: 1.9, yGapScale: 0.5, xWidth: 0.08, speedMin: 0.8, speedMax: 3, heightMin: 0.05, heightMax: 4, wave: { type: WAVE_TYPES.SINE, frequency: 0.04, amplitude: 0.4, phase: 0 } },
      { label: "RibbonsB", spacing: 2.1, yGapScale: 0.6, xWidth: 0.1, speedMin: 1, speedMax: 3.5, heightMin: 0.06, heightMax: 5, wave: { type: WAVE_TYPES.SAW, frequency: 0.06, amplitude: 0.35, phase: Math.PI / 3 } },
      { label: "RibbonsC", spacing: 1.8, yGapScale: 0.45, xWidth: 0.07, speedMin: 0.9, speedMax: 3.2, heightMin: 0.05, heightMax: 3.5, wave: { type: WAVE_TYPES.SQUARE, frequency: 0.03, amplitude: 0.2, phase: (2 * Math.PI) / 3 } },
      { label: "RibbonsD", spacing: 2.2, yGapScale: 0.65, xWidth: 0.11, speedMin: 1.1, speedMax: 3.8, heightMin: 0.08, heightMax: 5.5, wave: { type: WAVE_TYPES.SINE, frequency: 0.05, amplitude: 0.45, phase: Math.PI } },
      { label: "RibbonsE", spacing: 1.7, yGapScale: 0.5, xWidth: 0.09, speedMin: 0.7, speedMax: 3, heightMin: 0.05, heightMax: 4.2, wave: { type: WAVE_TYPES.SAW, frequency: 0.07, amplitude: 0.3, phase: (4 * Math.PI) / 3 } },
      { label: "RibbonsF", spacing: 2, yGapScale: 0.55, xWidth: 0.08, speedMin: 1, speedMax: 3.4, heightMin: 0.06, heightMax: 4.8, wave: { type: WAVE_TYPES.SQUARE, frequency: 0.035, amplitude: 0.25, phase: (5 * Math.PI) / 3 } },
      { label: "RibbonsG", spacing: 1.9, yGapScale: 0.6, xWidth: 0.1, speedMin: 0.9, speedMax: 3.6, heightMin: 0.05, heightMax: 5, wave: { type: WAVE_TYPES.SINE, frequency: 0.045, amplitude: 0.4, phase: Math.PI / 6 } },
      { label: "RibbonsH", spacing: 2.1, yGapScale: 0.5, xWidth: 0.07, speedMin: 1.2, speedMax: 3, heightMin: 0.08, heightMax: 3.8, wave: { type: WAVE_TYPES.SAW, frequency: 0.055, amplitude: 0.3, phase: Math.PI / 2 } },
      { label: "RibbonsI", spacing: 1.8, yGapScale: 0.65, xWidth: 0.12, speedMin: 0.8, speedMax: 3.8, heightMin: 0.06, heightMax: 5.3, wave: { type: WAVE_TYPES.SQUARE, frequency: 0.025, amplitude: 0.2, phase: (5 * Math.PI) / 6 } },
      { label: "RibbonsJ", spacing: 2, yGapScale: 0.45, xWidth: 0.09, speedMin: 1.1, speedMax: 3.2, heightMin: 0.05, heightMax: 4, wave: { type: WAVE_TYPES.SINE, frequency: 0.06, amplitude: 0.5, phase: (7 * Math.PI) / 6 } },
      { label: "RibbonsK", spacing: 1.9, yGapScale: 0.55, xWidth: 0.08, speedMin: 0.9, speedMax: 3.5, heightMin: 0.07, heightMax: 4.7, wave: { type: WAVE_TYPES.SAW, frequency: 0.04, amplitude: 0.35, phase: (4 * Math.PI) / 3 } },
      { label: "RibbonsL", spacing: 2.2, yGapScale: 0.6, xWidth: 0.1, speedMin: 1, speedMax: 3, heightMin: 0.05, heightMax: 4.3, wave: { type: WAVE_TYPES.SQUARE, frequency: 0.03, amplitude: 0.25, phase: (3 * Math.PI) / 2 } },
      { label: "RibbonsM", spacing: 1.8, yGapScale: 0.5, xWidth: 0.09, speedMin: 0.8, speedMax: 3.6, heightMin: 0.08, heightMax: 5, wave: { type: WAVE_TYPES.SINE, frequency: 0.05, amplitude: 0.4, phase: (11 * Math.PI) / 6 } },
    ];

    this.groupConfigs = groupVariants.map((variant, i) => ({
      ribbonCount: this.worldParams.ribbonCount,
      groupXOffset: (i - (groupVariants.length - 1) / 2) * GROUP_SPACING,
      xGapScale: this.xGapScale,
      planeCount: this.sharedParams.planeCount,
      ...variant,
    }));
    // make the ribbon groups
    this.ribbonGroups = this.groupConfigs.map(
      (config) => new RibbonGroup({ world: this, groupParams: config }),
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
