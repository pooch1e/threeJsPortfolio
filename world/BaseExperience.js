/**
 * BaseExperience — shared scene/camera/renderer/loop machinery every scene
 * builds on. Subclasses customise it through the hooks below rather than by
 * reimplementing the constructor:
 *
 *   setupScene()      configure the scene itself (background, fog)
 *   createResources() return a Resources instance; defaults to a bare emitter
 *   cameraOptions()   options object forwarded to Camera (fov, controls, ...)
 *   setupCamera()     position/aim the camera once it exists
 *   audioOptions()    return an options object to opt into this.audio
 *   setupUtils()      per-scene extras assigned onto `this` (e.g. this.mouse)
 *   createWorld()     required — returns the scene's World
 *   initWorld()       override to defer world construction (e.g. until 'ready')
 */
import { Scene } from "three";
import { Sizes } from "./utils/Sizes.js";
import { Time } from "./utils/Time.js";
import { Debug } from "./utils/Debug.js";
import { Camera } from "./objects/Camera.js";
import { Renderer } from "./objects/Renderer.js";
import EventEmitter from "./utils/EventEmitter.js";
import { disposeScene } from "./utils/disposeScene.js";
import { AudioSource } from "./utils/AudioSource.js";

export class BaseExperience {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.scene = new Scene();
    this.sizes = new Sizes();
    this.time = new Time();
    this.debug = new Debug(options.debug);

    this.setupScene();

    this.resources = this.createResources();

    this.camera = new Camera({
      canvas: this.canvas,
      sizes: this.sizes,
      ...this.cameraOptions(),
    });

    this.setupCamera();

    const audioOptions = this.audioOptions();
    if (audioOptions) {
      this.audio = new AudioSource({
        camera: this.camera.perspectiveCamera,
        canvas: this.canvas,
        debug: this.debug,
        ...audioOptions,
      });
    }

    this.renderer = new Renderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
    });

    this.setupUtils();
    this.initWorld();

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

  audioOptions() {
    return null;
  }

  setupUtils() {}

  createWorld() {
    throw new Error(`${this.constructor.name} must implement createWorld()`);
  }

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
    this.audio?.update(this.time);
    if (this.world) {
      this.world.update(this.time);
    }
    this.stats?.end();
  }

  destroy() {
    this.sizes.off("resize");
    this.time.off("tick");
    // A pending 'ready' would otherwise fire after teardown and rebuild the
    // world, and its debug folders, into a disposed scene.
    this.resources?.off?.("ready");

    if (this.mouse) this.mouse.destroy();

    this.audio?.destroy();

    if (this.time.animationId) {
      cancelAnimationFrame(this.time.animationId);
    }

    if (this.world) {
      this.world.destroy?.();
    }

    disposeScene(this.scene);

    if (this.camera?.controls) this.camera.controls.dispose();
    if (this.renderer?.renderer) this.renderer.renderer.dispose();

    if (this.debug?.active && this.debug?.ui) this.debug.ui.destroy();
  }
}
