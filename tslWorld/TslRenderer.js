/**
 * TslRenderer — WebGPU counterpart of world/objects/Renderer.js. Wraps
 * WebGPURenderer behind the same resize()/update() surface and exposes a
 * `ready` promise that resolves once the async device setup has finished;
 * nothing may render before then.
 */
import { WebGPURenderer, CineonToneMapping } from 'three/webgpu';

export class TslRenderer {
  constructor({ canvas, sizes, scene, camera, forceWebGL = false }) {
    this.canvas = canvas;
    this.sizes = sizes;
    this.scene = scene;
    this.camera = camera;

    this.renderer = new WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      forceWebGL,
    });
    this.renderer.toneMapping = CineonToneMapping;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height);

    this.ready = this.renderer.init();
  }

  resize() {
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  update() {
    this.renderer.render(this.scene, this.camera.perspectiveCamera);
  }
}
