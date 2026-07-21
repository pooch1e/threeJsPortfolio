
import { BaseExperience } from "../BaseExperience";
import { World } from "./World";
import { Mouse } from "../utils/Mouse";
import { Resources } from "../utils/Resources";
import { sources } from "../sources/sources";


export class ForestExperience extends BaseExperience {
  createWorld() {
    return new World(this)
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
    this.resources = new Resources(sources)
  }
}
