// View for meshes
import * as THREE from 'three';
import { Environment } from './Environment';
export class WorldView {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.setMesh();

    //Environment
    this.environment = new Environment(this.world);
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
