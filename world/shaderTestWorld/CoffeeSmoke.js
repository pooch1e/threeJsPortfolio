import * as THREE from 'three';
import { Wireframe } from 'three/examples/jsm/Addons.js';
export default class CoffeeSmoke {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    // setup
    this.resource = this.resources.items.coffeeSmokeModel;
    this.setModel();
    this.setSmoke();
    this.setDebug();
  }

  setModel() {
    this.model = this.resource.scene;

    const bakedMesh = this.model.getObjectByName('baked');
    if (bakedMesh && bakedMesh.material && bakedMesh.material.map) {
      bakedMesh.material.map.anisotropy = 8;
    }

    this.scene.add(this.model);
  }

  setSmoke() {
    this.smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
    this.smokeGeometry.translate(0, 0.5, 0);
    this.smokeGeometry.scale(1.5, 6, 1.5);

    this.tempSmokeMaterial = new THREE.MeshBasicMaterial({
      color: 'cyan',
      wireframe: true,
    });

    this.smoke = new THREE.Mesh(this.smokeGeometry, this.tempSmokeMaterial);
    this.smoke.position.y = 1.83;
    this.scene.add(this.smoke);
  }

  setDebug() {}

  update(time) {
    if (time) {
    }
  }
}
