import { AxesHelper } from 'three';
export class Helpers {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.axisHelper = null;
  }

  setAxisHelper() {
    this.axisHelper = new AxesHelper();
    this.scene.add(this.axisHelper);
  }
}
