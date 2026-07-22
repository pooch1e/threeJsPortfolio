
import { Forest } from "./Forest.js";
import { Color } from "three";

export class World {
  constructor(experience) {
    this.gridSize = 18;
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = this.experience.resources;

    // this.scene.background = new Color('#8FC93A')

    this.resources.on("ready", () => {
      this.forest = new Forest(this);
    });

  }

  update() {}
}
