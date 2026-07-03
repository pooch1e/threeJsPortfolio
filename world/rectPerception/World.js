import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { RibbonGroup } from "./RibbonGroup";

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

    this.xGapScale = 0.3;

    this.sharedParams = {
      yGapScale: 1,
      planeCount: 10,
      xWidth: 0.2,
    };

    this.groupConfigs = [
      {
        label: "RibbonsA",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 0,
        xGapScale: this.xGapScale,
        yGapScale: 1,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
      },
      {
        label: "RibbonsB",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 15,
        xGapScale: this.xGapScale,
        yGapScale: 1,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
      },
    ];
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
