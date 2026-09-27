/**
 * Mouse — normalised pointer position on a canvas, plus raycasting helpers.
 * Emits 'move' (mouse or touch drag), 'click' and 'leave'.
 */
import { Vector2, Raycaster } from 'three';
import EventEmitter from './EventEmitter';

export class Mouse extends EventEmitter {
  constructor(canvas, camera) {
    super();
    this.canvas = canvas;
    this.camera = camera;

    // Normalised device coordinates (-1 to +1)
    this.position = new Vector2();

    // Raycaster for 3D object intersection
    this.raycaster = new Raycaster();

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.handleClick = (event) => {
      this.updatePosition(event);
      this.trigger('click', [this.position, event]);
    };

    this.handleMove = (event) => {
      this.updatePosition(event);
      this.trigger('move', [this.position, event]);
    };

    // mousemove does not fire during a touch drag, so touch feeds 'move' too
    this.handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;

      this.updatePosition(touch);
      this.trigger('move', [this.position, event]);
    };

    this.handleLeave = (event) => {
      this.trigger('leave', [this.position, event]);
    };

    // Click event
    this.canvas.addEventListener('click', this.handleClick);

    // Mouse move event
    this.canvas.addEventListener('mousemove', this.handleMove);

    this.canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: true,
    });
    this.canvas.addEventListener('pointerleave', this.handleLeave);
    this.canvas.addEventListener('touchend', this.handleLeave);
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

    // Create a ray from camera through the mouse position
    this.raycaster.setFromCamera(this.position, camera);

    // Get the point at the specified distance along the ray
    const direction = this.raycaster.ray.direction;
    const position = camera.position
      .clone()
      .add(direction.multiplyScalar(depth));

    return position;
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
    if (this.handleTouchMove) {
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
    if (this.handleLeave) {
      this.canvas.removeEventListener('pointerleave', this.handleLeave);
      this.canvas.removeEventListener('touchend', this.handleLeave);
    }
  }
}
