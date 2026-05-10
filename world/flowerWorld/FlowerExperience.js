import { Scene, Mesh, Points, LineSegments } from "three";
import { Sizes } from "../utils/Sizes.js";
import { Time } from "../utils/Time.js";
import { Debug } from "../utils/Debug.js";
import { Camera } from "../objects/Camera.js";
import { Renderer } from "../objects/Renderer.js";
import { World } from "./World.js";
import { Resources } from "../utils/Resources.js";
import { sources } from "../sources/sources.js";

// Controller
export class FlowerExperience {
  constructor(canvas, options = {}) {
    // SETUP PROPERTIES
    this.canvas = canvas;
    this.debug = new Debug(options.debug);
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new Scene();
    this.resources = new Resources(
      sources.filter((s) => s.name === "flowerModel")
    );

    this.camera = new Camera({
      canvas: this.canvas,
      sizes: this.sizes,
    });

    this.renderer = new Renderer({
      canvas: this.canvas,
      sizes: this.sizes,
      scene: this.scene,
      camera: this.camera,
    });

    // Wait for resources to finish loading before building the world
    this.resources.on("ready", () => {
      this.world = new World(this);
    });

    // Resize event
    this.sizes.on("resize", () => {
      this.resize();
    });

    this.time.on("tick", () => {
      this.update();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.renderer.update();
    // Pass time to world for animations (world may not exist yet while resources load)
    if (this.world) {
      this.world.update(this.time);
    }
  }

  destroy() {
    this.sizes.off("resize");
    this.time.off("tick");

    // Stop animation loop
    if (this.time.animationId) {
      cancelAnimationFrame(this.time.animationId);
    }

    // Destroy world and its children
    if (this.world) {
      this.world.destroy?.();
    }

    // Traverse the whole scene and cleanup
    this.scene.traverse((child) => {
      // Cleanup geometries for Mesh, Points, and LineSegments
      if (
        child instanceof Mesh ||
        child instanceof Points ||
        child instanceof LineSegments
      ) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Dispose material(s)
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material) => {
            // Loop through material properties
            for (const key in material) {
              const value = material[key];

              if (value && typeof value.dispose === "function") {
                value.dispose();
              }
            }

            material.dispose();
          });
        }
      }
    });

    // Dispose controls and renderer
    if (this.camera?.controls) {
      this.camera.controls.dispose();
    }

    if (this.renderer?.instance) {
      this.renderer.instance.dispose();
    }

    // Destroy debug UI
    if (this.debug?.active && this.debug?.ui) {
      this.debug.ui.destroy();
    }
  }
}
