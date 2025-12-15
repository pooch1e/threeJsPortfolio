import * as THREE from 'three'
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
    this.sphereMaterial = new THREE.ShaderMaterial();
    
  }

}
