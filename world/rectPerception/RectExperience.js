/**
 * Entry point for the Ryoji scene — scrolling ribbon groups inspired by
 * Ryoji Ikeda, framed by a fixed camera position.
 */
import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

export class RectExperience extends BaseExperience {

  createWorld() {
    return new World(this);
  }

  setupCamera() {
    this.camera.perspectiveCamera.position.set(7.5, -9, 15);
    if (this.camera.controls) {
      this.camera.controls.target.set(7.5, 15, -10);
      this.camera.controls.update();
    }
  }
}
