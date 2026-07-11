
import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import Stats from "stats.js";
import { BaseExperience } from "../BaseExperience.js";

// Controller
export class ShaderExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }

  update() {
    this.stats.begin();
    this.camera.update();
    this.renderer.update();
    // Pass time to world for animations
    this.world.update(this.time);
    this.stats.end();
  }
}
