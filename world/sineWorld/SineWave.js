// will be a sine wave of points
import * as THREE from 'three';
export default class SinePoints {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.sineExperience.debug;

    this.params = {
      count: 100,
      size: 10,
      amplitude: 2,
      frequency: 2,
      speed: 1,
    };

    this.setPoints();
    this.setDebug();
  }

  setPoints() {
    // Cleanup old geometry and points if they exist
    if (this.points) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }

    // Create new geometry
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.params.count * 3);

    // Initialize positions along a sine wave
    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (i / this.params.count) * 10 - 5;
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
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Sine Wave');
      this.debugFolder.add(this.params, 'amplitude', 0.5, 5, 0.1);
      this.debugFolder.add(this.params, 'frequency', 0.5, 10, 0.1);
      this.debugFolder.add(this.params, 'speed', 0.1, 5, 0.1);
      this.debugFolder
        .add(this.params, 'count')
        .min(100)
        .max(1000)
        .step(10)
        .onChange(() => {
          this.setPoints();
        });
    }
  }

  update(time) {
    if (time && this.positions) {
      const positions = this.geometry.attributes.position.array;
      
      // Modulate frequency with a sine wave
      const modulatedFrequency = this.params.frequency + Math.sin(time.elapsedTime * 0.0005) * 2;

      for (let i = 0; i < this.params.count; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        positions[i3 + 1] =
          Math.sin(x * modulatedFrequency + time.elapsedTime * 0.001 * this.params.speed) *
          this.params.amplitude;
      }

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
