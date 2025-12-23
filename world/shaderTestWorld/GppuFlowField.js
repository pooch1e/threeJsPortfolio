import * as THREE from 'three';

import particlesVertexShader from './shaders/gppuFlowField/vertex.glsl';
import particlesFragmentShader from './shaders/gppuFlowField/fragment.glsl';
export default class GppuFlowField {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = this.world.shdaerExperience.debug;
    this.sizes = world.shdaerExperience.sizes;

    this.model = this.resources.items.shipModel;
    this.debugObject = {};

    this.setModel();
    this.setDebug();
  }

  setModel() {
    // Geometry
    this.geometry = new THREE.SphereGeometry(3);

    // Material
    this.material = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uSize: new THREE.Uniform(0.4),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
      },
    });

    // Points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('GPPU Flow Field');
      this.debugFolder
        .add(this.material.uniforms.uSize, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('uSize');
    }
  }

  update(time) {}

  destroy() {}
}
