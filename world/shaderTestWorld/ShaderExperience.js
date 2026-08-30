import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import { BaseExperience } from "../BaseExperience.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

// Controller
export class ShaderExperience extends BaseExperience {
  createResources() {
    return new Resources(sources);
  }

  createWorld() {
    return new World(this);
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
  }
}
