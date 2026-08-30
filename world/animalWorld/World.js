/**
 * Composition root for the Animal scene. Builds the floor, fox, rat and
 * environment once the GLTF models have loaded, then drives the fox's
 * animation mixer each frame.
 */
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
      this.floor = new Floor(experience);
      this.fox = new Fox(experience);
      this.rat = new Rat(experience);
      this.environment = new Environment(experience);
    });
  }

  setMesh() {
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

  // Unsubscribing matters more than the child cleanup: leaving the route
  // before resources finish would otherwise let 'ready' build objects into
  // an already-disposed scene and GUI.
  destroy() {
    this.resources.off('ready');
    this.floor?.destroy?.();
    this.fox?.destroy?.();
    this.rat?.destroy?.();
    this.environment?.destroy?.();
  }
}
