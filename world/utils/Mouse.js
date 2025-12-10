import * as THREE from 'three';
import EventEmitter from './EventEmitter';

export class Mouse extends EventEmitter {
  constructor(canvas, camera) {
    super();
    this.canvas = canvas;
    this.camera = camera;

    // Normalised device coordinates (-1 to +1)
    this.position = new THREE.Vector2();

    // Raycaster for 3D object intersection
    this.raycaster = new THREE.Raycaster();

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Store bound handlers so we can remove them later
    this.handleClick = (event) => {
      this.updatePosition(event);
      this.trigger('click', [this.position, event]);
    };

    this.handleMove = (event) => {
      this.updatePosition(event);
      this.trigger('move', [this.position, event]);
    };

    // Click event
    this.canvas.addEventListener('click', this.handleClick);

    // Mouse move event
    this.canvas.addEventListener('mousemove', this.handleMove);
  }

  updatePosition(event) {
    const rect = this.canvas.getBoundingClientRect();

    // Normalised
    this.position.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.position.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  // default depth - can change
  getWorldPosition(depth = 10) {
    const camera = this.camera.perspectiveCamera || this.camera.instance;
    const vector = new THREE.Vector3(this.position.x, this.position.y, 0.5);
    vector.unproject(camera);

    const dir = vector.sub(camera.position).normalize();
    const distance = depth / dir.z;

    return camera.position
      .clone()
      .add(dir.multiplyScalar(distance));
  }

  // for raycasting
  getIntersects(objects) {
    const camera = this.camera.perspectiveCamera || this.camera.instance;
    this.raycaster.setFromCamera(this.position, camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  destroy() {
    if (this.handleClick) {
      this.canvas.removeEventListener('click', this.handleClick);
    }
    if (this.handleMove) {
      this.canvas.removeEventListener('mousemove', this.handleMove);
    }
  }
}
