import * as THREE from 'three';
import { Point } from './Point';

export class World {
  constructor(pointExperience) {
    this.pointExperience = pointExperience;
    this.scene = this.pointExperience.scene;

    this.setEnvironment();
    this.setMesh();
  }

  setEnvironment;

  setPoints() {
    this.point = new Point();
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
