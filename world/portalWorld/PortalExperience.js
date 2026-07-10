import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";

export class PortalExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }
}
