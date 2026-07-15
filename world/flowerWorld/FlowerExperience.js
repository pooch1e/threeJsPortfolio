import { BaseExperience } from "../BaseExperience.js";
import { World } from "./World.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

/**
 * Entry point for the "Flower" scene, wired up by BaseExperience's shared
 * scene/camera/renderer/resize/update-loop machinery (see world/BaseExperience.js).
 * Loads the flower GLTF model, then builds the World (GPGPU particle flowers
 * + background text grid) once that model has finished loading.
 */
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
