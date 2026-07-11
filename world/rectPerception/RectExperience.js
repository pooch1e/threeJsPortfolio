
import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

// Controller
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
