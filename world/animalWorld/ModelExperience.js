import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

// Controller
export class ModelExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }
}
