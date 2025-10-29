// View for meshes
import * as THREE from 'three';
import { Environment } from './Environment';
import { Resources } from './utils/Resources.js';
import { sources } from './sources/sources.js';
export class WorldView {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.setMesh();

    this.resources = new Resources(sources);

    this.resources.on('ready', () => {
      //Environment
      this.environment = new Environment(this.world);
    });
  }

  setMesh() {
    //test mesh
    const testMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );

    this.scene.add(testMesh);
  }
}
