import * as THREE from 'three';
import { Sizes } from './utils/Sizes.js';
import { Time } from './utils/Time.js';
import { Camera } from './Camera.js';

export class World {
  constructor(canvas) {
    // SETUP
    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera();

    // Resize event
    this.sizes.on('resize', () => {
      this.resize();
    });

    // Time tick event (animation loop)
    this.time.on('tick', () => {
      this.update();
    });
  }

  resize() {}

  update() {}
}
