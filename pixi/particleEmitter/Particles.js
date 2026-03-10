import { Graphics } from 'pixi.js';
import { Mouse } from '../utils/Mouse';

export class Particles {
  constructor(world) {
    this.world = world;
    this.app = world.experience.app;
    this.stage = world.experience.renderer.stage;
    this.sizes = world.experience.sizes;

    this.mouse = new Mouse(this.app.canvas);
    this.ellipse = null;
  }

  init() {
    this.ellipse = new Graphics();
    this.ellipse.ellipse(0, 0, 50, 50).fill({ color: 0xff0000 });
    this.stage.addChild(this.ellipse);
  }

  update() {
    this.ellipse.x = this.mouse.x;
    this.ellipse.y = this.mouse.y;
  }

  destroy() {
    this.mouse.destroy();
  }
}
