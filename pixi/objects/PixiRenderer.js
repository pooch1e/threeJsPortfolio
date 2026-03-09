import { Application } from 'pixi.js';

export class PixiRenderer {
  constructor({ container, sizes }) {
    this.container = container;
    this.sizes = sizes;
    this.app = new Application();
  }

  async init() {
    await this.app.init({
      width: this.sizes.width,
      height: this.sizes.height,
      antialias: true,
      autoDensity: true,
      resolution: this.sizes.pixelRatio,
      background: 0x000000,
    });

    this.container.appendChild(this.app.canvas);
  }

  get stage() {
    return this.app.stage;
  }

  get ticker() {
    return this.app.ticker;
  }

  get canvas() {
    return this.app.canvas;
  }

  resize() {
    this.app.renderer.resize(this.sizes.width, this.sizes.height);
  }

  destroy() {
    // true = also remove canvas element from DOM
    this.app.destroy(true, { children: true });
  }
}
