// View for meshes
import * as THREE from 'three';
import { Environment } from './Environment';
import { Resources } from './utils/Resources.js';
import { sources } from './sources/sources.js';
import { Floor } from './Floor.js';
export class WorldView {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.setMesh();

    this.resources = new Resources(sources);

    this.resources.on('ready', () => {
      //Environment
      this.floor = new Floor(this);
      this.environment = new Environment(this);
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
