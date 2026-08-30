
import { Forest } from "./Forest.js";

export class World {
  constructor(experience) {
    this.gridSize = 18;
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;

    this.resources.on("ready", () => {
      this.forest = new Forest(experience, this.gridSize);
    });

  }

  update() {}

  destroy() {
    this.resources.off("ready");
    this.forest?.destroy?.();
  }
}
