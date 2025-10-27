import * as THREE from 'three';
export class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.sizes = {
      height: canvas.height,
      width: canvas.width,
    };
    this.scene;
  }
  
}
