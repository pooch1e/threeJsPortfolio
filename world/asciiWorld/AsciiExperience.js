/**
 * Entry point for the ASCII scene. Runs without orbit controls and wires a
 * Mouse so the character grid can react to the cursor.
 */
import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import { BaseExperience } from "../BaseExperience.js";

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
  }
}
