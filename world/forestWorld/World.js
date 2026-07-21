
import { Forest } from "./Forest.js";
import { Color } from "three";

export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = this.experience.resources;

    this.scene.background = new Color('black')

    this.resources.on("ready", () => {
      this.forest = new Forest(this);
    });

  }

  update() {}
}
