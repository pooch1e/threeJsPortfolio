import * as THREE from 'three';
import { Sizes } from './utils/Sizes.js';

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.sizes = new Sizes();

    // Resize event
    this.sizes.on('resize', () => {
      console.log('A resize occurred');
    });

    this.scene = new THREE.Scene();
  }
}
