import { Ribbon } from "./Ribbon";

export class RibbonGroup {
  constructor({ world, groupParams }) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.rectExperience.debug;

    // { label, ribbonCount, spacing, groupXOffset, xGapScale, yGapScale, planeCount, xWidth }
    this.groupParams = { ...groupParams };

    this.xGapScale = this.groupParams.xGapScale;
    this.sharedParams = {
      yGapScale: this.groupParams.yGapScale,
      planeCount: this.groupParams.planeCount,
      xWidth: this.groupParams.xWidth,
    };

    this.ribbons = [];
    this.buildRibbons();
    this.setDebug();
  }

  buildRibbons() {
    const { ribbonCount, spacing, groupXOffset } = this.groupParams;
    for (let i = 0; i < ribbonCount; i++) {
      const ribbonIndex = i - (ribbonCount - 1) / 2;
      const ribbon = new Ribbon({
        world: this.world,
        ribbonParams: {
          ...this.sharedParams,
          ribbonXPos: groupXOffset + ribbonIndex * spacing * this.xGapScale,
        },
      });
      ribbon.ribbonIndex = ribbonIndex;
      this.ribbons.push(ribbon);
    }
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder(
        this.groupParams.label ?? "Ribbons",
      );

      const pushToRibbons = (key) => (value) => {
        this.ribbons.forEach((ribbon) => ribbon.updateParams({ [key]: value }));
      };

      this.debugFolder
        .add(this, "xGapScale", 0.15, 3, 0.05)
        .name("X Gap Scale")
        .onChange((value) => {
          const { spacing, groupXOffset } = this.groupParams;
          this.ribbons.forEach((ribbon) => {
            ribbon.setXPosition(
              groupXOffset + ribbon.ribbonIndex * spacing * value,
            );
          });
        });

      this.debugFolder
        .add(this.sharedParams, "yGapScale", 0, 3, 0.05)
        .name("Y Gap Scale")
        .onChange(pushToRibbons("yGapScale"));

      this.debugFolder
        .add(this.sharedParams, "planeCount", 1, 30, 1)
        .name("Plane Count")
        .onChange(pushToRibbons("planeCount"));

      this.debugFolder
        .add(this.sharedParams, "xWidth", 0.05, 2, 0.05)
        .name("X Width")
        .onChange(pushToRibbons("xWidth"));

      this.debugFolder
        .add(this.groupParams, "groupXOffset", -10, 10, 0.1)
        .name("Group X Offset")
        .onChange(pushToRibbons("groupXOffset"));
    }
  }

  update(time) {
    this.ribbons.forEach((ribbon) => ribbon.update(time));
  }

  destroy() {
    this.ribbons.forEach((ribbon) => ribbon.destroy());
  }
}
