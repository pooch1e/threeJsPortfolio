import { PerspectiveCamera } from 'three/src/Three.Core.js';

export class Camera {
  constructor({ fov = 75, aspect = 1, near = 0.1, far = 2000 }) {
    this.perspectiveCamera = new PerspectiveCamera(fov, aspect, near, far);
  }
}
