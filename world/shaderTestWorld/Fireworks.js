import * as THREE from 'three';

export class Fireworks {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;

    // Setup
    this.setDebug();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('FireWorks');
    }
  }

  update(time) {
    if (this.time) {
      console.log('time test');
    }
  }
}
