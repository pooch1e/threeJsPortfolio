/**
 * Point — animated point cloud plus randomly connected line segments
 * between points, both tweakable through the debug panel.
 */
import { BufferGeometry, BufferAttribute, PointsMaterial, Points, LineBasicMaterial, LineSegments } from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
export class Point {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.debug = experience.debug;

    this.params = {
      count: 1000,
      size: 0.05,
      color: 0xffffff,
      scale: 0.01,
      connectionsPerPoint: 1,
      lineColor: 0xffffff,
      lineOpacity: 0.3,
      chanceToConnect: 0.5,
    };

    this.setGeometry();
    this.setDebug();
  }

  setGeometry() {
    this.geometry = new BufferGeometry();

    const positions = new Float32Array(this.params.count * 3);

    const perlin = new ImprovedNoise();

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

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
      new BufferAttribute(positions, 3)
    );

    this.material = new PointsMaterial({
      size: this.params.size,
      color: this.params.color,
    });

    this.points = new Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.setLines(positions);
  }

  setLines(positions) {
    const lineGeometry = new BufferGeometry();

    const linePositions = [];

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;

      for (let j = 0; j < this.params.connectionsPerPoint; j++) {
        const randomIndex = Math.floor(Math.random() * this.params.count) * 3;

        linePositions.push(
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2],
          positions[randomIndex],
          positions[randomIndex + 1],
          positions[randomIndex + 2]
        );
      }
    }

    lineGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(linePositions), 3)
    );

    const lineMaterial = new LineBasicMaterial({
      color: this.params.lineColor,
      transparent: true,
      opacity: this.params.lineOpacity,
    });


    this.lines = new LineSegments(lineGeometry, lineMaterial);

    this.scene.add(this.lines);
  }

  updateGeometry() {
    this.points.geometry.dispose();

    const geometry = new BufferGeometry();
    const positions = new Float32Array(this.params.count * 3);

    const perlin = new ImprovedNoise();

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

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

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.points.geometry = geometry;

    if (this.lines) {
      this.scene.remove(this.lines);
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }

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

      linesFolder
        .addColor(this.params, 'lineColor')
        .name('Line Color')
        .onChange(() => {
          this.lines.material.color.set(this.params.lineColor);
        });

      linesFolder
        .add(this.params, 'chanceToConnect')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Reconnect Speed');
    }
  }

  update(time) {
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

      if (!this.originalPositions) {
        this.originalPositions = new Float32Array(positions);
      }

      for (let i = 0; i < this.params.count; i++) {
        const i3 = i * 3;

        positions[i3 + 1] =
          this.originalPositions[i3 + 1] + Math.sin(t + i * 0.1) * 0.5;
      }

      this.points.geometry.attributes.position.needsUpdate = true;
    }
  }

  destroy() {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
    }

    if (this.lines) {
      this.scene.remove(this.lines);
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }

    if (this.debugFolder) {
      this.debugFolder.destroy();
    }

    this.originalPositions = null;
  }
}
