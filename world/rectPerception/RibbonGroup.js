import { Ribbon } from "./Ribbon";
import { wave, WAVE_TYPES } from "../utils/Wave";

export class RibbonGroup {
  constructor({ world, groupParams }) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.rectExperience.debug;

    // { label, ribbonCount, spacing, groupXOffset, xGapScale, yGapScale, planeCount, xWidth, wave }
    this.groupParams = { ...groupParams };

    this.waveParams = {
      type: WAVE_TYPES.SINE,
      frequency: 0.1,
      amplitude: 0,
      offset: 1,
      phase: 0,
      ...groupParams.wave,
    };

    this.xGapScale = this.groupParams.xGapScale;
    this.sharedParams = {
      yGapScale: this.groupParams.yGapScale,
      planeCount: this.groupParams.planeCount,
      xWidth: this.groupParams.xWidth,
      speedMin: this.groupParams.speedMin ?? 0.5,
      speedMax: this.groupParams.speedMax ?? 3,
      heightMin: this.groupParams.heightMin ?? 1,
      heightMax: this.groupParams.heightMax ?? 10,
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
        .add(this.sharedParams, "heightMin", 0.1, 10, 0.1)
        .name("Height Min")
        .onChange(pushToRibbons("heightMin"));

      this.debugFolder
        .add(this.sharedParams, "heightMax", 0.1, 20, 0.1)
        .name("Height Max")
        .onChange(pushToRibbons("heightMax"));

      this.debugFolder
        .add(this.groupParams, "groupXOffset", -10, 10, 0.1)
        .name("Group X Offset")
        .onChange(pushToRibbons("groupXOffset"));

      const rerollSpeeds = () => {
        const { speedMin, speedMax } = this.sharedParams;
        this.ribbons.forEach((ribbon) =>
          ribbon.setSpeedRange(speedMin, speedMax),
        );
      };

      this.debugFolder
        .add(this.sharedParams, "speedMin", 0, 10, 0.1)
        .name("Speed Min")
        .onChange(rerollSpeeds);

      this.debugFolder
        .add(this.sharedParams, "speedMax", 0, 10, 0.1)
        .name("Speed Max")
        .onChange(rerollSpeeds);
    }
  }

  update(time, speedMultiplier = 1) {
    const waveMultiplier = wave(
      this.waveParams.type,
      time.elapsedTime * 0.001,
      this.waveParams,
    );
    this.ribbons.forEach((ribbon) =>
      ribbon.update(time, speedMultiplier * waveMultiplier),
    );
  }

  destroy() {
    this.ribbons.forEach((ribbon) => ribbon.destroy());
  }
}
