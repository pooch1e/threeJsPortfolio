/**
 * Entry point for the Shader scene. Loads every shared model and texture up
 * front so the World can swap between shaders without reloading, and wires
 * a Mouse for the shaders that raycast.
 */
import { World } from "./World.js";

import { Mouse } from "../utils/Mouse.js";
import { BaseExperience } from "../BaseExperience.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

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
