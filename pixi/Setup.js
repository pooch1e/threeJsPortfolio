import { Application } from 'pixi.js';
import { Sizes } from '../world/utils/Sizes';

export class Setup {
  constructor(WorldClass, container, options = {}) {
    this.WorldClass = WorldClass;
    this.container = container;
    this.options = options;
    this.sizes = new Sizes();
    this.app = new Application();
    this.world = null;
    this._initialised = false;
    this._destroyed = false;
  }

  async init() {
   
    await this.app.init({
      width: this.sizes.width,
      height: this.sizes.height,
      antialias: true,
      autoDensity: true,
      resolution: this.sizes.pixelRatio,
    });


    if (this._destroyed) {
      this.app.destroy(true, { children: true });
      this.sizes.destroy();
      return;
    }

    
    this.container.appendChild(this.app.canvas);

    this.world = new this.WorldClass(this.app, this.sizes, this.options);
    await this.world.init();

    if (this._destroyed) {
      this.world.destroy();
      this.app.destroy(true, { children: true });
      this.sizes.destroy();
      return;
    }

    this._initialised = true;

    // Resize via Sizes EventEmitter — namespaced so it can be removed cleanly
    this.sizes.on('resize.pixi', () => {
      this.app.renderer.resize(this.sizes.width, this.sizes.height);
      if (this.world?.resize) {
        this.world.resize(this.sizes.width, this.sizes.height);
      }
    });

    // Ticker drives the draw loop
    this.app.ticker.add(() => {
      if (this.world?.update) {
        this.world.update(this.app.ticker);
      }
    });
  }

  destroy() {
    this._destroyed = true;

    // If init() hasn't finished yet, it will check _destroyed at each await
    // point and clean up itself once app.init() resolves.
    if (!this._initialised) return;

    this.sizes.off('resize.pixi');
    this.world?.destroy();
    // true = also remove the canvas element from the DOM
    this.app.destroy(true, { children: true });
    this.sizes.destroy();
  }
}
