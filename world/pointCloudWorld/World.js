import * as THREE from 'three';
import { Point } from './Point';
import EventEmitter from '../utils/EventEmitter';

export class World {
  constructor(pointExperience) {
    this.pointExperience = pointExperience;
    this.scene = this.pointExperience.scene;
    this.resources = this.pointExperience.resources;

    // this.setEnvironment(); commented out until environment added

    this.point = new Point(this);
  }

  setMesh() {
    //test mesh
    this.testMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );

    this.scene.add(this.testMesh);
  }

  update(time) {
    if (this.point) {
      this.point.update(time);
    }
  }
}
