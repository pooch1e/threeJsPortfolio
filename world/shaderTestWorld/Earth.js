import * as THREE from 'three';
import earthVertex from './shaders/earth/vertex.glsl';
import earthFragment from './shaders/earth/fragment.glsl';
export default class Earth {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = world.resources;

    // Setup
    this.setModel();
  }

  setModel() {
    this.sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
    this.sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
    });

    this.earthMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.scene.add(this.earthMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Earth Shader');
    }
  }

  update(time) {}

  destroy() {}
}
