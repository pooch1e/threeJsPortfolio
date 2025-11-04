import * as THREE from 'three';
export class Point {
  constructor(worldView) {
    this.world = worldView.world;
    this.scene = worldView.scene;

    // SETUP
    this.setGeometry();
  }

  setGeometry() {
    this.geometry = new THREE.Points();
    this.scene.add(this.geometry);
  }
}
