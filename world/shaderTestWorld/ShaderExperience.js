import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import { BaseExperience } from "../BaseExperience.js";

// Controller
export class ShaderExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
  }
}
