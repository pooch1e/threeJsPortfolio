/**
 * Composition root for the Portal scene. Builds the baked portal model and
 * its firefly particles once the GLTF and texture have loaded.
 */
import { Portal } from "./Portal";
export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;

    this.resources.on("ready", () => {
      this.portal = new Portal(experience);
    });
  }

  update(time) {
    if (this.portal && time) {
      this.portal.update(time);
    }
  }

  destroy() {
    this.resources.off("ready");
    this.portal?.destroy?.();
  }
}
