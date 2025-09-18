import * as THREE from 'three'
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    const sizes = {
      height: canvas.height,
      width: canvas.width
    }
  }

  this.renderer = new THREE.WebGLRenderer({canvas})

}