/**
 * Composition root for the Point Cloud scene. Owns the Point object that
 * renders the animated points and their random line connections.
 */
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { Point } from './Point';


export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    // this.setEnvironment(); commented out until environment added

    this.point = new Point(experience);
  }

  setMesh() {
    this.testMesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial()
    );

    this.scene.add(this.testMesh);
  }

  update(time) {
    if (this.point) {
      this.point.update(time);
    }
  }

  destroy() {
    if (this.point) {
      this.point.destroy();
    }

    if (this.testMesh) {
      this.scene.remove(this.testMesh);
      this.testMesh.geometry.dispose();
      this.testMesh.material.dispose();
    }
  }
}
