import * as THREE from 'three';
import galaxyVertex from './shaders/galaxy/vertex.glsl';
import galaxyFragment from './shaders/galaxy/fragment.glsl';
export default class Galaxy {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.renderer = this.world.shaderExperience.renderer;

    // params for galaxy debug ui

    this.params = {
      count: 5000,
      size: 30,
      radius: 5,
      branches: 3,
      spin: 1,
      randomness: 0.5,
      randomnessPower: 3,
      insideColor: '#ff6030',
      outsideColor: '#1b3984',
    };

    this.setShader();
    this.setDebug();
  }

  setShader() {
    // Clean up old geometry/material/points
    if (this.points) {
      this.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.points);
    }

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.params.count * 3);
    this.colors = new Float32Array(this.params.count * 3);

    // scale * count by 1 as need float value - not vec3
    this.scales = new Float32Array(this.params.count * 1);

    this.insideColor = new THREE.Color(this.params.insideColor);
    this.outsideColor = new THREE.Color(this.params.outsideColor);

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3;

      // Positions
      const radius = Math.random() * this.params.radius;
      const branchAngle =
        ((i % this.params.branches) / this.params.branches) * Math.PI * 2;

      const randomX =
        Math.pow(Math.random(), this.params.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.params.randomness *
        radius;
      const randomY =
        Math.pow(Math.random(), this.params.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.params.randomness *
        radius;
      const randomZ =
        Math.pow(Math.random(), this.params.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        this.params.randomness *
        radius;

      this.positions[i3] = Math.cos(branchAngle) * radius + randomX;
      this.positions[i3 + 1] = randomY;
      this.positions[i3 + 2] = Math.sin(branchAngle) * radius + randomZ;

      // Color
      const mixedColor = this.insideColor.clone();
      mixedColor.lerp(this.outsideColor, radius / this.params.radius);

      this.colors[i3] = mixedColor.r;
      this.colors[i3 + 1] = mixedColor.g;
      this.colors[i3 + 2] = mixedColor.b;

      // Scale
      this.scales[i] = Math.random();
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.geometry.setAttribute(
      'aScales',
      new THREE.BufferAttribute(this.scales, 1)
    );
    /**
     * Material
     */
    this.material = new THREE.ShaderMaterial({
      vertexShader: galaxyVertex,
      fragmentShader: galaxyFragment,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uSize: { value: 30 * this.renderer.renderer.getPixelRatio() },
      },
    });

    /**
     * Points
     */
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Galaxy UI');

      this.debugFolder
        .add(this.params, 'count')
        .min(100)
        .max(1000000)
        .step(100)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .add(this.params, 'size')
        .min(1)
        .max(100)
        .step(0.1)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .add(this.params, 'radius')
        .min(0.01)
        .max(20)
        .step(0.01)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .add(this.params, 'branches')
        .min(2)
        .max(20)
        .step(1)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .add(this.params, 'randomness')
        .min(0)
        .max(2)
        .step(0.001)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .add(this.params, 'randomnessPower')
        .min(1)
        .max(10)
        .step(0.001)
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .addColor(this.params, 'insideColor')
        .onFinishChange(() => this.setShader());
      this.debugFolder
        .addColor(this.params, 'outsideColor')
        .onFinishChange(() => this.setShader());
    }
  }

  update() {
    // console.log('updating');
  }

  destroy() {
    // as shader using points, need custom destroy method
    if (this.points) {
      this.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.points);
    }
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
