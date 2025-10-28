import { PerspectiveCamera } from 'three/src/Three.Core.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export class Camera {
  constructor({
    canvas,
    fov = 75,
    aspect = window.innerWidth / window.innerHeight,
    near = 0.1,
    far = 2000,
  }) {
    this.canvas = canvas;

    // Orbital Controls
    this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
    this.controls.enableDamping = true; 
    this.controls.dampingFactor = 0.05;

    this.perspectiveCamera = new PerspectiveCamera(fov, aspect, near, far);
  }

  resize(width, height) {
    this.perspectiveCamera.aspect = width / height;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
