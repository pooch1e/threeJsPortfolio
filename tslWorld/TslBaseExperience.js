/**
 * TslBaseExperience — BaseExperience running on WebGPURenderer. Only the
 * renderer is swapped; world creation and the tick/resize listeners are held
 * back by BaseExperience until the renderer's `ready` promise resolves.
 * Subclasses implement the same hooks as BaseExperience.
 */
import { BaseExperience } from '../world/BaseExperience.js';
import { TslRenderer } from './TslRenderer.js';

export class TslBaseExperience extends BaseExperience {
  createRenderer() {
    return new TslRenderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
      forceWebGL: this.options?.forceWebGL,
    });
  }
}
