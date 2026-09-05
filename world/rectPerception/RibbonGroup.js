/**
 * RibbonGroup — a cluster of Ribbons sharing width/speed/height parameters,
 * scrolled together by a wave multiplier with a red highlight sweeping
 * through the group.
 */
import { Ribbon } from "./Ribbon";
import { wave } from "../utils/Wave";
import {
  buildSharedParams,
  buildWaveParams,
  computeRibbonXPos,
} from "./utils/rectWorldHelpers";


export class RibbonGroup {
  constructor({ experience, groupParams }) {
    this.experience = experience;
    this.debug = experience.debug;
    this.groupParams = { ...groupParams };

    this.waveParams = buildWaveParams(groupParams.wave);

    this.sharedParams = buildSharedParams(this.groupParams);

    this.ribbons = [];
    this.buildRibbons();
    this.setDebug();

    this.activeRedIndex = -1;
  }

  buildRibbons() {
    const { ribbonCount, spacing, groupXOffset, ribbonWidth } = this.groupParams;
    for (let i = 0; i < ribbonCount; i++) {
      const ribbon = new Ribbon({
        experience: this.experience,
        ribbonParams: {
          ...this.sharedParams,
          ribbonXPos: computeRibbonXPos(groupXOffset, spacing, ribbonWidth, i),
          colour: null,
        },
      });

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
        .add(this.sharedParams, "yGapScale", 0, 3, 0.05)
        .name("Y Gap Scale")
        .onChange(pushToRibbons("yGapScale"));

      this.debugFolder
        .add(this.sharedParams, "planeCount", 1, 30, 1)
        .name("Plane Count")
        .onChange(pushToRibbons("planeCount"));

      this.debugFolder
        .add(this.sharedParams, "ribbonWidth", 0.05, 2, 0.05)
        .name("Ribbon Width")
        .onChange(pushToRibbons("ribbonWidth"));

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

  stepRedSweep() {
    if (this.ribbons.length === 0) return;

    const previous = this.ribbons[this.activeRedIndex];
    if (previous) previous.setColour(previous.baseColour);

    this.activeRedIndex = (this.activeRedIndex + 1) % this.ribbons.length;
    this.ribbons[this.activeRedIndex].setColour("red");
  }

  destroy() {
    this.ribbons.forEach((ribbon) => ribbon.destroy());
  }
}
