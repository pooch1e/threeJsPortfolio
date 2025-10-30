import * as THREE from 'three';
import { Sizes } from './utils/Sizes.js';
import { Time } from './utils/Time.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { WorldView } from './WorldView.js';

// Controller
export class World {
  constructor(canvas) {
    // SETUP PROPERTIES
    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    
    this.camera = new Camera({
      canvas: this.canvas,
      sizes: this.sizes,
    });

    this.renderer = new Renderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
    });
    // this references --  this context
    this.worldView = new WorldView(this);
    
    
   

    // Resize event
    this.sizes.on('resize', () => {
      this.resize();
    });

    this.time.on('tick', () => {
      this.update();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.renderer.update();
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('tick');
  }
}
