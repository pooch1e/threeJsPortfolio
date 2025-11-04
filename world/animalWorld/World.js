// View for meshes
// Where actual objects instantiated
import * as THREE from 'three';
import { Environment } from './Environment.js';
import { Resources } from '../utils/Resources.js';
import { sources } from '../sources/sources.js';
import { Floor } from './Floor.js';
import { Fox } from './Fox.js';
import { Rat } from './Rat.js';
export class World {
  constructor(modelExperience) {
    this.modelExperience = modelExperience;
    this.scene = this.modelExperience.scene;

    this.resources = new Resources(sources);

    this.resources.on('ready', () => {
      //Environment
      this.floor = new Floor(this);
      this.fox = new Fox(this);
      this.rat = new Rat(this);
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

  update() {
    if (this.fox) {
      this.fox.update();
    }
  }
}
