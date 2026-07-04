import { MeshBasicMaterial, Mesh, PlaneGeometry, Group } from "three";
import { randomFloat, randomInt } from "../../src/utils/helpers";

export class Ribbon {
  constructor({ world, ribbonParams }) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.rectExperience.debug;
    this.time = this.world.rectExperience.time;

    // ribbon param object to control in debug
    this.ribbonParamsDebug = { ...ribbonParams };

    this.ribbonGroup = new Group();

    // const material as nothing gonna change
    this.material = new MeshBasicMaterial({
      wireframe: false,
    });

    this.ribbonGroup.position.x = this.ribbonParamsDebug.ribbonXPos;

    this.setPlanes();

    this.scene.add(this.ribbonGroup);
    // start lower than camera
    this.ribbonGroup.position.y = -10;
  }

  setPlanes() {
    // each ribbon is made up of planes with same width, variable heights,
    // stacked straight up on y with a y-gap between them
    const { xWidth, planeCount, yGapScale } = this.ribbonParamsDebug;


    while (this.ribbonGroup.children.length > 0) {
      const mesh = this.ribbonGroup.children.pop();
      this.ribbonGroup.remove(mesh);
      mesh.geometry.dispose();
    }

    let yOffset = 0;

    for (let i = 1; i <= planeCount; i++) {
      const height = randomFloat(1, 10);
      const planeGeometry = new PlaneGeometry(xWidth, height);

      // translate origin of geometry to base as it is in middle on instatiation
      planeGeometry.translate(0, height / 2, 0);

      const mesh = new Mesh(planeGeometry, this.material);
      mesh.position.y = yOffset;
      this.ribbonGroup.add(mesh);

      yOffset += height + randomInt(1, 10) * yGapScale;
    }
  }

  updateParams(newParams) {
    Object.assign(this.ribbonParamsDebug, newParams);
    this.setPlanes();
  }

  setXPosition(x) {
    this.ribbonParamsDebug.ribbonXPos = x;
    this.ribbonGroup.position.x = x;
  }

  destroy() {
    this.scene.remove(this.ribbonGroup);
    this.ribbonGroup.children.forEach((mesh) => mesh.geometry.dispose());
    this.material.dispose();
  }

  update(time) {}
}
