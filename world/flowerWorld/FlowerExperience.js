import { BaseExperience } from "../BaseExperience.js";
import { World } from "./World.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

export class FlowerExperience extends BaseExperience {
  createResources() {
    return new Resources(sources.filter((s) => s.name === "flowerModel"));
  }

  createWorld() {
    return new World(this);
  }

  initWorld() {
    this.resources.on("ready", () => {
      this.world = this.createWorld();
    });
  }
}
