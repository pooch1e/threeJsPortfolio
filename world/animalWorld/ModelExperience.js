/**
 * Entry point for the Animal scene. Loads the GLTF models and builds the
 * World that renders the fox, rat, floor and lighting.
 */
import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

export class ModelExperience extends BaseExperience {
  createResources() {
    return new Resources(sources);
  }

  createWorld() {
    return new World(this);
  }
}
