import { World } from "./World.js";
import { BaseExperience } from "../BaseExperience.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

export class PortalExperience extends BaseExperience {
  createResources() {
    return new Resources(sources);
  }

  createWorld() {
    return new World(this);
  }
}
