import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { Ribbon } from "./Ribbon";

export class World {
  constructor(rectExperience) {
    this.rectExperience = rectExperience;
    this.debug = this.rectExperience.debug;
    this.scene = this.rectExperience.scene;
    this.resources = this.rectExperience.resources;
    console.log(this.rectExperience);

    this.params = {
      spacing: 2,
      ribbonCount: 20,
    };

    for (let i = 0; i < this.params.ribbonCount; i++) {
      // position ribbons left and right of camera
      const ribbonXOffset = i - (this.params.ribbonCount - 1) / 2;

      const xWidthOffset = ribbonXOffset;
      new Ribbon({
        world: this,
        xWidth: 0.2,
        xOffset: xWidthOffset,
      });
    }
  }

  update(time) {
    if (this.ribbon) {
      this.ribbon.update(time);
    }
  }

  destroy() {
    // Destroy point instance
    if (this.ribbon) {
      this.ribbon.destroy();
    }

    // Dispose test mesh if it exists
    if (this.testMesh) {
      this.scene.remove(this.testMesh);
      this.testMesh.geometry.dispose();
      this.testMesh.material.dispose();
    }
  }
}
