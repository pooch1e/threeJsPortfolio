import * as THREE from 'three';
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.sizes = {
      height: canvas.height,
      width: canvas.width,
    };
  }
  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas });
  }

  getSizes() {
    console.log(this.sizes);
    console.log(this.renderer);
  }
}
