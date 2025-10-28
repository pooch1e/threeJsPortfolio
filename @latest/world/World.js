import * as THREE from 'three';
import { Sizes } from './utils/Sizes.js';
import { Time } from './utils/Time.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';

export class World {
  constructor(canvas) {
    // SETUP PROPERTIES
    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera({
      canvas: this.canvas,
      aspect: this.sizes.aspect,
    });
    this.renderer = new Renderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
    });

    // Resize event
    this.sizes.on('resize', () => {
      this.resize();
    });

    // Time tick event (animation loop)
    this.time.on('tick', () => {
      this.update();
    });

    // Create Scene
  }

  resize() {
    this.camera.resize(this.sizes.width, this.sizes.height);
  }

  update() {
    this.camera.update();
  }
}
