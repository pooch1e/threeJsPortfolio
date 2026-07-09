import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import Stats from "stats.js";
import { BaseExperience } from "../BaseExperience.js";

// Controller
export class AsciiExperience extends BaseExperience {
  cameraOptions() {
    return {
      controls: false,
    };
  }

  createWorld() {
    return new World(this);
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
    this.stats = new Stats();
    this.stats.showPanel(0);
  }

  update() {
    this.stats.begin();
    this.camera.update();
    this.renderer.update();
    this.world.update(this.time);
    this.stats.end();
  }
}
