import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

// Controller
export class ModelExperience extends BaseExperience {
  createResources() {
    return new Resources(sources);
  }

  createWorld() {
    return new World(this);
  }
}
