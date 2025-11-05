import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';
export class Point {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.pointExperience.debug;
    this.time = this.world.pointExperience.time;

    // Parameters for points and lines
    this.params = {
      count: 1000,
      size: 0.05,
      color: 0xffffff,
      scale: 0.01,
      // Line parameters
      connectionsPerPoint: 1,
      lineColor: 0xffffff,
      lineOpacity: 0.3,
      //animation params
      chanceToConnect: 0.5,
    };

    // SETUP
    this.setGeometry();
    this.setDebug();
  }

  setGeometry() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.params.count * 3);

    const perlin = new ImprovedNoise();

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      //displacement
      positions[i3] =
        x +
        perlin.noise(
          x * this.params.scale,
          y * this.params.scale,
          z * this.params.scale
        );
      positions[i3 + 1] =
        y +
        perlin.noise(
          x * this.params.scale + 100,
          y * this.params.scale,
          z * this.params.scale
        );
      positions[i3 + 2] =
        z +
        perlin.noise(
          x * this.params.scale,
          y * this.params.scale + 100,
          z * this.params.scale
        );
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create material
    this.material = new THREE.PointsMaterial({
      size: this.params.size,
      color: this.params.color,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.setLines(positions);
  }

  setLines(positions) {
    // Create geometry to hold all the line segments
    const lineGeometry = new THREE.BufferGeometry();

    // Array to store all line positions (each line needs 2 points = 6 values)
    const linePositions = [];

    // Loop through each point
    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;

      // For each point, create N random connections to other points
      for (let j = 0; j < this.params.connectionsPerPoint; j++) {
        // Pick a random point to connect to
        const randomIndex = Math.floor(Math.random() * this.params.count) * 3;

        // Add a line segment by pushing 6 values:
        // First 3 values: starting point (x, y, z)
        // Next 3 values: ending point (x, y, z)
        linePositions.push(
          positions[i3], // Start X
          positions[i3 + 1], // Start Y
          positions[i3 + 2], // Start Z
          positions[randomIndex], // End X
          positions[randomIndex + 1], // End Y
          positions[randomIndex + 2] // End Z
        );
      }
    }

    // Convert the array to Float32Array (required by Three.js)
    // Set it as the position attribute for the line geometry
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );

    // Create material for the lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.params.lineColor,
      transparent: true,
      opacity: this.params.lineOpacity,
    });

    // LineSegments draws individual disconnected line segments

    this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);

    this.scene.add(this.lines);
  }

  updateGeometry() {
    // Dispose old point geometry
    this.points.geometry.dispose();

    // Create new geometry with updated count
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.params.count * 3);

    const perlin = new ImprovedNoise();

    // Generate new point positions
    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      // Displacement
      positions[i3] =
        x +
        perlin.noise(
          x * this.params.scale,
          y * this.params.scale,
          z * this.params.scale
        );
      positions[i3 + 1] =
        y +
        perlin.noise(
          x * this.params.scale + 100,
          y * this.params.scale,
          z * this.params.scale
        );
      positions[i3 + 2] =
        z +
        perlin.noise(
          x * this.params.scale,
          y * this.params.scale + 100,
          z * this.params.scale
        );
    }

    // Update points geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.points.geometry = geometry;

    // Remove old lines from scene and dispose
    if (this.lines) {
      this.scene.remove(this.lines);
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }

    // Recreate lines with new positions
    this.setLines(positions);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Points');

      this.debugFolder
        .add(this.params, 'count')
        .min(100)
        .max(50000)
        .step(100)
        .name('Count')
        .onChange(() => {
          this.updateGeometry();
        });

      this.debugFolder
        .add(this.params, 'size')
        .min(0.01)
        .max(0.5)
        .step(0.01)
        .name('Size')
        .onChange(() => {
          this.material.size = this.params.size;
        });

      this.debugFolder
        .addColor(this.params, 'color')
        .name('Color')
        .onChange(() => {
          this.material.color.set(this.params.color);
        });

      this.debugFolder
        .add(this.params, 'scale')
        .min(0.01)
        .max(2)
        .step(0.01)
        .name('Noise Scale')
        .onChange(() => {
          this.updateGeometry();
        });

      const linesFolder = this.debug.ui.addFolder('Lines');

      linesFolder
        .add(this.params, 'connectionsPerPoint')
        .min(0)
        .max(10)
        .step(1)
        .name('Connections Per Point')
        .onChange(() => {
          // Need to regenerate all lines when connection count changes
          this.updateGeometry();
        });

      linesFolder
        .add(this.params, 'lineOpacity')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Line Opacity')
        .onChange(() => {
          this.lines.material.opacity = this.params.lineOpacity;
        });

      // Control line color
      linesFolder
        .addColor(this.params, 'lineColor')
        .name('Line Color')
        .onChange(() => {
          this.lines.material.color.set(this.params.lineColor);
        });

      // Control animation speed
      linesFolder
        .add(this.params, 'chanceToConnect')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Reconnect Speed');
    }
  }

  update(time) {
    // Animate lines to connect randomly
    if (this.lines && Math.random() < this.params.chanceToConnect) {
      const positions = this.lines.geometry.attributes.position.array;
      const pointPositions = this.points.geometry.attributes.position.array;

      const lineIndex = Math.floor(Math.random() * (positions.length / 6)) * 6;
      const randomPoint = Math.floor(Math.random() * this.params.count) * 3;

      positions[lineIndex + 3] = pointPositions[randomPoint];
      positions[lineIndex + 4] = pointPositions[randomPoint + 1];
      positions[lineIndex + 5] = pointPositions[randomPoint + 2];

      this.lines.geometry.attributes.position.needsUpdate = true;
    }

    if (this.points && time) {
      const positions = this.points.geometry.attributes.position.array;
      const t = time.elapsedTime * 0.001; // Convert ms to seconds

      // Store original positions once
      if (!this.originalPositions) {
        this.originalPositions = new Float32Array(positions);
      }

      // Animate each point
      for (let i = 0; i < this.params.count; i++) {
        const i3 = i * 3;

        // Oscillate Y position around original
        positions[i3 + 1] =
          this.originalPositions[i3 + 1] + Math.sin(t + i * 0.1) * 0.5;
      }

      this.points.geometry.attributes.position.needsUpdate = true;
    }
  }
}
