// View for meshes
// Where actual objects instantiated
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { Environment } from './Environment.js';
import { Floor } from './Floor.js';
import { Fox } from './Fox.js';
import { Rat } from './Rat.js';
export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;

    this.resources.on('ready', () => {
      //Environment
      this.floor = new Floor(experience);
      this.fox = new Fox(experience);
      this.rat = new Rat(experience);
      this.environment = new Environment(experience);
    });
  }

  setMesh() {
    //test mesh
    const testMesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial()
    );

    this.scene.add(testMesh);
  }

  update() {
    if (this.fox) {
      this.fox.update();
    }
  }
}
