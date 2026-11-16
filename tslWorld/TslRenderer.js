/**
 * TslRenderer — WebGPU counterpart of world/objects/Renderer.js. Wraps
 * WebGPURenderer behind the same resize()/update() surface and exposes a
 * `ready` promise that resolves once the async device setup has finished;
 * nothing may render before then.
 */
import { WebGPURenderer, CineonToneMapping, InspectorBase } from 'three/webgpu';
import { Inspector } from 'three/addons/inspector/Inspector.js'

export class TslRenderer {
  constructor({ canvas, sizes, scene, camera, forceWebGL = false, inspector = false }) {
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

    this.ready = this.setupAndInit(inspector);
  }

  async setupAndInit(inspector) {
    if (inspector) {

      this.renderer.inspector = new Inspector();
    }
    await this.renderer.init();
  }

  resize() {
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  dispose() {
    this.detachInspector();

    // The WebGL fallback backend calls loseContext() on dispose. A StrictMode remount reuses the same attached canvas, so disposing here would kill the context the next renderer is drawing to.
    this.ready.then(() => {
      if (!this.canvas.isConnected) this.renderer.dispose();
    }, () => {});
  }

  detachInspector() {
    const inspector = this.renderer.inspector;
    if (!(inspector instanceof Inspector)) return;

    // Inspectors chain console hooks, so this one must be unhooked before the next renderer installs its own, i.e. synchronously, not after `ready`.
    this.renderer.inspector = new InspectorBase();

    // Inspector's own async init appends its panel after renderer.init() with no disposed check, so remove it again once that has run.
    const removePanel = () => {
      inspector.domElement.remove();
      inspector._domObserver?.disconnect();
    };
    this.ready.then(removePanel, removePanel);
  }

  update() {
    this.renderer.render(this.scene, this.camera.perspectiveCamera);
  }
}
