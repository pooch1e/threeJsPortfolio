/**
 * RectExperience — the Ryoji scene: a fixed-camera row of scrolling ribbon
 * groups, with a music track whose high-band clicks and low-end pulse each step
 * their own colour sweep through the ribbons.
 */
import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

export class RectExperience extends BaseExperience {

  createWorld() {
    return new World(this);
  }
  cameraOptions() {
    return { controls: false };
  }

  audioOptions() {
    return {
      path: "/static/audio/Principle.mp3",
      volume: 0.4,
      smoothing: 0.12,
      triggers: {
        beat: {
          band: [2000, 8000],
          threshold: 0.35,
          holdMs: 120,
          eq: [{ band: [2000, 3000], gain: 0.6 }],
        },
        pulse: { band: [60, 250], threshold: 0.55, holdMs: 300 },
      },
    };
  }

  setupCamera() {
    this.camera.perspectiveCamera.position.set(10, -4, 10);
    this.camera.perspectiveCamera.lookAt(7.5, 5, -10);
  }
}
