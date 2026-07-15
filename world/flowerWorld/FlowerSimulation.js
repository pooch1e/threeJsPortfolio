/**
 * Owns the single shared GPGPU flow-field particle simulation used by every
 * FlowerPoints instance, plus the particle geometry they all render (aParticlesUv/
 * aSize/aColor attributes — identical for every flower since they all read the
 * same simulation texture by the same UV lookup, so it's safe to share one
 * BufferGeometry across multiple Points objects rather than duplicating it).
 *
 * The flow-field noise only depends on a particle's local position and time,
 * not on where a flower sits in the scene, so one GPUComputationRenderer pass
 * can drive many differently-positioned, differently-colored flowers —
 * FlowerPoints instances read getTexture()/getGeometry() and apply their own
 * position via modelMatrix instead of the simulation baking a world offset in.
 *
 * update() throttles the compute() call to TARGET_FPS: flower motion doesn't
 * need to recompute every render frame to look right, and this is the
 * expensive part of the scene.
 */
import {
  Uniform,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  BufferAttribute,
} from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import particleShader from "./shaders/particles/particles.glsl";

const TARGET_FPS = 15;
const TICK_INTERVAL = 1000 / TARGET_FPS;

export default class FlowerSimulation {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = world.flowerExperience.debug;
    this.renderer = world.flowerExperience.renderer.renderer;

    this.model = this.resources.items.flowerModel;
    this.gltf = this.model;

    this._accumulator = 0;

    this.setup();
  }

  setup() {
    this.baseGeometry = {};
    this.baseGeometry.instance = this.gltf.scene.children[0].geometry;
    this.baseGeometry.count =
      this.baseGeometry.instance.attributes.position.count;

    this.gpgpu = {};
    this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count));

    this.gpgpu.computation = new GPUComputationRenderer(
      this.gpgpu.size,
      this.gpgpu.size,
      this.renderer,
    );

    this.gpgpu.baseParticleTexture = this.gpgpu.computation.createTexture();

    const posArr = this.baseGeometry.instance.attributes.position.array;
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < this.baseGeometry.count; i++) {
      const x = posArr[i * 3 + 0];
      const y = posArr[i * 3 + 1];
      const z = posArr[i * 3 + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const longestSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const targetSize = 3;
    this.modelScale = longestSpan > 0 ? targetSize / longestSpan : 1;
    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };

    const s = this.modelScale;
    for (let i = 0; i < this.baseGeometry.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      this.gpgpu.baseParticleTexture.image.data[i4 + 0] = posArr[i3 + 0] * s;
      this.gpgpu.baseParticleTexture.image.data[i4 + 1] = posArr[i3 + 1] * s;
      this.gpgpu.baseParticleTexture.image.data[i4 + 2] = posArr[i3 + 2] * s;
      this.gpgpu.baseParticleTexture.image.data[i4 + 3] = Math.random();
    }

    this.gpgpu.particleVariable = this.gpgpu.computation.addVariable(
      "uParticles",
      particleShader,
      this.gpgpu.baseParticleTexture,
    );
    this.gpgpu.computation.setVariableDependencies(
      this.gpgpu.particleVariable,
      [this.gpgpu.particleVariable],
    );

    this.gpgpu.particleVariable.material.uniforms.uTime = new Uniform(0);
    this.gpgpu.particleVariable.material.uniforms.uBase = new Uniform(
      this.gpgpu.baseParticleTexture,
    );
    this.gpgpu.particleVariable.material.uniforms.uDeltaTime = new Uniform(0);
    this.gpgpu.particleVariable.material.uniforms.uFieldInfluence =
      new Uniform(0.5);

    this.gpgpu.computation.init();

    this.gpgpu.debug = new Mesh(
      new PlaneGeometry(3, 3),
      new MeshBasicMaterial({
        visible: false,
        map: this.gpgpu.computation.getCurrentRenderTarget(
          this.gpgpu.particleVariable,
        ).texture,
      }),
    );
    this.gpgpu.debug.position.x = 3;
    this.scene.add(this.gpgpu.debug);

    if (this.model) {
      const modelScene = this.model.scene ?? this.model;
      modelScene.visible = false;
      this.scene.add(modelScene);
    }

    this.buildGeometry();
    this.setDebug();
  }

  buildGeometry() {
    this.geometry = new BufferGeometry();

    const particlesUvArray = new Float32Array(this.baseGeometry.count * 2);
    const sizesArray = new Float32Array(this.baseGeometry.count);

    for (let y = 0; y < this.gpgpu.size; y++) {
      for (let x = 0; x < this.gpgpu.size; x++) {
        const i = y * this.gpgpu.size + x;
        const i2 = i * 2;

        const uvX = (x + 0.5) / this.gpgpu.size;
        const uvY = (y + 0.5) / this.gpgpu.size;

        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;

        sizesArray[i] = 0.5 + Math.random() * 0.5;
      }
    }

    this.geometry.setAttribute(
      "aParticlesUv",
      new BufferAttribute(particlesUvArray, 2),
    );
    this.geometry.setAttribute("aSize", new BufferAttribute(sizesArray, 1));
    this.geometry.setAttribute(
      "aColor",
      this.baseGeometry.instance.attributes.color,
    );

    this.geometry.setDrawRange(0, this.baseGeometry.count);
  }

  getGeometry() {
    return this.geometry;
  }

  getTexture() {
    return this.gpgpu.computation.getCurrentRenderTarget(
      this.gpgpu.particleVariable,
    ).texture;
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Flower Flow Field");

      this.debugFolder
        .add(
          this.gpgpu.particleVariable.material.uniforms.uFieldInfluence,
          "value",
        )
        .min(0)
        .max(1)
        .step(0.001)
        .name("Flow Field Influence");

      this.debugFolder
        .add(this.gpgpu.debug.material, "visible")
        .name("Show GPGPU Texture");
    }
  }

  update(time) {
    if (!this.gpgpu) return;

    this._accumulator += time.deltaTime;
    if (this._accumulator < TICK_INTERVAL) return;
    this._accumulator = 0;

    this.gpgpu.particleVariable.material.uniforms.uTime.value =
      time.elapsedTime * 0.001;
    this.gpgpu.particleVariable.material.uniforms.uDeltaTime.value =
      TICK_INTERVAL * 0.001;

    this.gpgpu.computation.compute();
  }

  destroy() {
    this.debugFolder?.destroy();

    this.scene.remove(this.gpgpu.debug);
    this.gpgpu.debug.geometry.dispose();
    this.gpgpu.debug.material.dispose();
    this.gpgpu.computation.dispose?.();
    this.gpgpu.baseParticleTexture.dispose();

    this.geometry.dispose();

    if (this.model) {
      const modelScene = this.model.scene ?? this.model;
      this.scene.remove(modelScene);
      modelScene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
  }
}
