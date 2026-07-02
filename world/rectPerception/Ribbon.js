import { MeshBasicMaterial, Mesh, PlaneGeometry, Group } from "three";
import { randomFloat, randomInt } from "../../src/utils/helpers";
export class Ribbon {
  constructor({ world, xOffset, xWidth }) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.rectExperience.debug;
    this.time = this.world.rectExperience.time;

    this.ribbonGroup = new Group();

    // const material as nothing gonna change
    this.material = new MeshBasicMaterial({
      wireframe: false,
    });

    this.setMeshes({ xWidth, xOffset });

    this.scene.add(this.ribbonGroup);
    this.ribbonGroup.position.y = -10;
  }

  setMeshes({ xWidth, xOffset }) {
    // each ribbon is made up of planes with same x, variable y's
    // need to ensure the gap between each plane exists
    // the y of each plane kinda needs to be longer than the last one

    let offset = 0;

    for (let i = 1; i <= 10; i++) {
      const height = randomFloat(1, 5);
      this.planeGeometry = new PlaneGeometry(xWidth, height);
      // translate origin of geometry to base as it is in middle on instatiation
      this.planeGeometry.translate(0, height / 2, 0);

      const mesh = new Mesh(this.planeGeometry, this.material);
      mesh.position.y = offset;
      this.ribbonGroup.position.x = xOffset;
      this.ribbonGroup.add(mesh);

      const randomGap = randomInt(1, 2);
      offset += height + randomGap;
    }
  }

  destroy() {
    console.log("destroyed");
  }

  update(time) {
    if (time) {
      console.log("animating");
    }
  }
}
