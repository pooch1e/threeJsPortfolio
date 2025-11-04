import * as THREE from 'three';
import { Sizes } from '../utils/Sizes.js';
import { Time } from '../utils/Time.js';
import { Camera } from '../objects/Camera.js';
import { Renderer } from '../objects/Renderer.js';
import { World } from './World.js';
import { Debug } from '../utils/Debug.js';

// Controller
export class ModelExperience {
  constructor(canvas, options = {}) {
    // SETUP PROPERTIES
    this.canvas = canvas;
    this.debug = new Debug(options.debug);
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
    // this references --  this context -- will extend this to be any worldview 'controller' I need
    this.world = new World(this);

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
    this.worldView.update();
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('tick');

    // Stop animation loop
    if (this.time.animationId) {
      cancelAnimationFrame(this.time.animationId);
    }

    // Destroy worldView and its children
    if (this.worldView) {
      this.worldView.destroy?.();
    }

    // Traverse the whole scene
    this.scene.traverse((child) => {
      // Test if it's a mesh
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key];

          // Test if there is a dispose function
          if (value && typeof value.dispose === 'function') {
            value.dispose();
          }
        }
      }
    });

    // Dispose controls and renderer
    if (this.camera?.controls) {
      this.camera.controls.dispose();
    }

    if (this.renderer?.instance) {
      this.renderer.instance.dispose();
    }

    // Destroy debug UI
    if (this.debug?.active && this.debug?.ui) {
      this.debug.ui.destroy();
    }
  }
}
