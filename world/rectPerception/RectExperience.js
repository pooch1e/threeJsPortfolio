import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

export class RectExperience extends BaseExperience {

  createWorld() {
    return new World(this);
  }
  cameraOptions() {
    return { controls: false };
  }

  setupCamera() {
    this.camera.perspectiveCamera.position.set(10, -5, 14);
    this.camera.perspectiveCamera.lookAt(7.5, 5, -10);
  }
}
