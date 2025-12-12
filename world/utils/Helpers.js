import * as THREE from 'three';
export class Helpers {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.axisHelper = null;
  }

  setAxisHelper() {
    this.axisHelper = new THREE.AxesHelper();
    this.scene.add(this.axisHelper);
  }
}
