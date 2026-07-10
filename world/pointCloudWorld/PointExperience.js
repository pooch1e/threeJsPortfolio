import { BaseExperience } from "../BaseExperience.js";
import { World } from "./World.js";

export class PointExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }
}
