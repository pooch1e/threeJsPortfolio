// will be a sine wave of points
import * as THREE from 'three';
export default class SinePoints {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.sineExperience.debug;

    this.params = {
      count: 1000,
      size: 0.05,
      scale: 0.01,
    };

    this.setPoints();
  }

  setPoints() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.params.count * 3);

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      this.positions[i3] = 3;
    }
    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.positions, 3),
    );
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {}
}
