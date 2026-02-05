// will be a sine wave of points
import * as THREE from 'three';
export default class SinePoints {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.sineExperience.debug;

    this.params = {
      count: 1000,
      size: 10,
      amplitude: 2,
      frequency: 2,
      speed: 1,
    };

    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Sine Wave');
      this.debugFolder.add(this.params, 'amplitude', 0.5, 5, 0.1);
      this.debugFolder.add(this.params, 'frequency', 0.5, 10, 0.1);
      this.debugFolder.add(this.params, 'speed', 0.1, 5, 0.1);
    }

    this.setPoints();
  }

  setPoints() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.params.count * 3);

    // Initialize positions along a sine wave
    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (i / this.params.count) * 10 - 5; // Spread from -5 to 5
      const y = Math.sin(x * this.params.frequency) * this.params.amplitude;
      const z = 0;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    );

    this.material = new THREE.PointsMaterial({
      size: this.params.size,
      color: 0x00ffff,
      sizeAttenuation: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    console.log('Sine wave added to scene:', this.points);
    console.log('Point count:', this.params.count);
    console.log('Scene children:', this.scene.children);
  }

  update(time) {
    if (time && this.positions) {
      this.geometry.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.points) {
      this.scene.remove(this.points);
    }
  }
}
