import { Sizes } from '../world/utils/Sizes';
import { Debug } from '../world/utils/Debug';
import { PixiRenderer } from './objects/PixiRenderer';

export class ParticleExperience {
  constructor(WorldClass, container, options = {}) {
    this.WorldClass = WorldClass;
    console.log(this.WorldClass)
    this.container = container;
    this.options = options;

    this.sizes = new Sizes();
    this.debug = new Debug(options.debug);
    this.renderer = new PixiRenderer({ container, sizes: this.sizes });

    // Expose app at the top level so worlds/features can reach it via experience.app
    this.app = this.renderer.app;

    this.world = null;
    this._initialised = false;
    this._destroyed = false;
  }

  async init() {
    await this.renderer.init();

    if (this._destroyed) {
      this.renderer.destroy();
      this.sizes.destroy();
      return;
    }

    this.world = new this.WorldClass(this);
    await this.world.init?.();

    if (this._destroyed) {
      this.world.destroy?.();
      this.renderer.destroy();
      this.sizes.destroy();
      return;
    }

    this._initialised = true;

    // Resize via Sizes EventEmitter — namespaced so it can be removed cleanly
    this.sizes.on('resize.pixi', () => {
      this.renderer.resize();
      this.world?.resize?.(this.sizes.width, this.sizes.height);
    });


    this.renderer.ticker.add(() => {
      this.world?.update?.(this.renderer.ticker);
    });
  }

  destroy() {
    this._destroyed = true;


    if (!this._initialised) return;

    this.sizes.off('resize.pixi');
    this.world?.destroy?.();
    this.renderer.destroy();
    this.sizes.destroy();

    if (this.debug?.active && this.debug?.ui) {
      this.debug.ui.destroy();
    }
  }
}
