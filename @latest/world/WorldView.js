// View for meshes
import * as THREE from 'three';
export class WorldView {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.setMesh();
  }

  setMesh() {
    //test mesh
    const testMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );

    this.scene.add(testMesh);
  }
}
