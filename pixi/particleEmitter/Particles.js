import { Graphics } from 'pixi.js';
export class Particles {
  constructor(world) {
    this.world = world;
    console.log(this.world);
    this.app = world.experience.app;
    this.graphics = new Graphics();

    this.initTestSquare();
  }

  async initTestSquare() {
    this.graphics.rect(0, 0, 100, 100).fill({ color: 'red' });
  }
}
