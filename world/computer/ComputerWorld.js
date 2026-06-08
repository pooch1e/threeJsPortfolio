import { Mesh, MeshStandardMaterial } from "three";
import { Environment } from "./Environment.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";
import { Computer } from "./Computer.js";

export class World {
  constructor(modelExperience) {
    this.modelExperience = modelExperience;
    this.scene = this.modelExperience.scene;

    this.resources = new Resources(sources);

    this.resources.on("ready", () => {
      //Environment
      this.computer = new Computer(this.resources);
      this.environment = new Environment(this);
    });
  }

  update() {}
}
