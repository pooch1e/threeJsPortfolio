import { Scene } from "three";
import { Sizes } from "./utils/Sizes.js";
import { Time } from "./utils/Time.js";
import { Debug } from "./utils/Debug.js";
import { Camera } from "./objects/Camera.js";
import { Renderer } from "./objects/Renderer.js";
import EventEmitter from "./utils/EventEmitter.js";
import { disposeScene } from "./utils/disposeScene.js";

export class BaseExperience {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.scene = new Scene();
    this.sizes = new Sizes();
    this.time = new Time();
    this.debug = new Debug(options.debug); // bool

    // config scene eg bg colour
    this.setupScene();

    this.resources = this.createResources();

    this.camera = new Camera({
      canvas: this.canvas,
      sizes: this.sizes,
      ...this.cameraOptions(),
    });

    this.setupCamera();

    this.renderer = new Renderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
    });

    // extras eg mouse events, stats etc - subclass assigns onto `this`
    this.setupUtils();
    this.initWorld();

    // bind events
    this.sizes.on("resize", () => {
      this.resize();
    });
    this.time.on("tick", () => {
      this.update();
    });
  }

  setupScene() {}

  createResources() {
    return new EventEmitter();
  }

  setupCamera() {}

  cameraOptions() {
    return {};
  }

  setupUtils() {}

  // must be implemented by subclass, returns `new World(this)`
  createWorld() {
    throw new Error(`${this.constructor.name} must implement createWorld()`);
  }

  // default: build world immediately. Subclasses that need to wait on
  // async resource loading (e.g. this.resources.on('ready', ...)) should
  // override this method instead.
  initWorld() {
    this.world = this.createWorld();
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.stats?.begin();
    this.camera.update();
    this.renderer.update();
    if (this.world) {
      this.world.update(this.time);
    }
    this.stats?.end();
  }

  destroy() {
    // Unsub events
    this.sizes.off("resize");
    this.time.off("tick");
    // Destroy optional extras
    if (this.mouse) this.mouse.destroy();

    // Stop animation loop
    if (this.time.animationId) {
      cancelAnimationFrame(this.time.animationId);
    }

    // Destroy world
    if (this.world) {
      this.world.destroy?.();
    }

    // Dispose all scene objects
    disposeScene(this.scene);

    // Dispose camera controls and renderer
    if (this.camera?.controls) this.camera.controls.dispose();
    if (this.renderer?.instance) this.renderer.instance.dispose();

    // Destroy debug UI
    if (this.debug?.active && this.debug?.ui) this.debug.ui.destroy();
  }
}
