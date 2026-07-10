import SineWorld from "./SineWorld.js";
import { BaseExperience } from "../BaseExperience.js";

export class SineExperience extends BaseExperience {
  createWorld() {
    return new SineWorld(this);
  }
}
