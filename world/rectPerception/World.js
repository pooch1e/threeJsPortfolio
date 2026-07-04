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

    this.xGapScale = 0.2;

    this.sharedParams = {
      yGapScale: 0.8,
      planeCount: 15,
      xWidth: 0.1,
    };

    this.groupConfigs = [
      {
        label: "RibbonsA",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 3,
        groupXOffset: -10,
        xGapScale: this.xGapScale,
        yGapScale: 1,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.08,
        speedMin: 0.2,
        speedMax: 1,
        heightMin: 0.5,
        heightMax: 4,
      },
      {
        label: "RibbonsB",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 0,
        xGapScale: this.xGapScale,
        yGapScale: 1,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 0.5,
        speedMax: 4,
        heightMin: 1,
        heightMax: 10,
      },
      {
        label: "RibbonsC",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 8,
        xGapScale: this.xGapScale,
        yGapScale: 1,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.15,
        speedMin: 1,
        speedMax: 6,
        heightMin: 0.3,
        heightMax: 2,
      },
      {
        label: "RibbonsD",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 15,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 0.3,
        speedMax: 2,
        heightMin: 2,
        heightMax: 14,
      },
      {
        label: "RibbonsE",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 25,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsF",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 35,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsG",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 45,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsH",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 55,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsI",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 65,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsJ",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: 75,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      // additional ribbons left of camera (I'm being lazy)
      {
        label: "RibbonsK",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: -20,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsL",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: -30,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
      },
      {
        label: "RibbonsM",
        ribbonCount: this.worldParams.ribbonCount,
        spacing: 2,
        groupXOffset: -40,
        xGapScale: this.xGapScale,
        yGapScale: 0.4,
        planeCount: this.sharedParams.planeCount,
        xWidth: 0.2,
        speedMin: 1.5,
        speedMax: 8,
        heightMin: 0.2,
        heightMax: 1.5,
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
