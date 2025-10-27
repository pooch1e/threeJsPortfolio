import * as THREE from 'three';
import { Sizes } from './utils/SIzes';

// Assuming window size always the same
export class World {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.sizes = new Sizes();

    // Resize event
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    });
  }
}
