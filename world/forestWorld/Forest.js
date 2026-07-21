import { Mesh, PlaneGeometry, MeshStandardMaterial, AmbientLight, DirectionalLight, RepeatWrapping } from "three";
import { randomElement } from "../../utils/helpers";

export const GRID_SIZE = 18;

export class Forest {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.resources = this.world.resources.items.flowerTextures;

    this.addLights()
    this.testPlane()

  }

  addLights() {
    this.scene.add(new AmbientLight("#ffffff", 1));
    const sun = new DirectionalLight("#ffffff", 2);
    sun.position.set(2, 3, 4);
    this.scene.add(sun);
  }

  testPlane() {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
      const texture = randomElement(this.resources);
      const tiles = 4;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(tiles, tiles);

      const plane = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshStandardMaterial({ map: texture, transparent: true })
      );
      this.scene.add(plane);
      plane.position.set(i, j, 0);
      }
    }
  }
}
