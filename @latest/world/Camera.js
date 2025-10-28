import { PerspectiveCamera } from 'three/src/Three.Core.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export class Camera {
  constructor({ canvas, fov = 75, sizes, near = 0.1, far = 2000 }) {
    this.canvas = canvas;
    this.sizes = sizes;

    this.perspectiveCamera = new PerspectiveCamera(
      fov,
      sizes.aspect,
      near,
      far
    );

    // Orbital Controls
    this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }

  resize() {
    this.perspectiveCamera.aspect = this.sizes.width / this.sizes.height;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
