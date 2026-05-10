import {
  Uniform,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Vector2,
  Points,
} from "three";
import vertexParticles from "./shaders/gppuFlower/vertex.glsl";
import fragmentParticles from "./shaders/gppuFlower/fragment.glsl";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import particleShader from "./shaders/particles/particles.glsl";
export default class FlowerField {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = this.world.flowerExperience.debug;
    this.sizes = world.flowerExperience.sizes;
    this.renderer = world.flowerExperience.renderer.renderer;

    if (this.resources) {
      this.model = this.resources.items.flowerModel;
    }

    this.setModel();
  }

  setModel() {
    this.baseGeometry = {};

    this.gltf = this.model;
    this.baseGeometry.instance = this.gltf.scene.children[0].geometry;

    // Geometry
    this.baseGeometry.count =
      this.baseGeometry.instance.attributes.position.count;

    // GPU COMPUTE - Ping pong render
    this.gpgpu = {};
    this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count));

    // Each pixel of the FBOs (texture) will correspond to one particle
    this.gpgpu.computation = new GPUComputationRenderer(
      this.gpgpu.size,
      this.gpgpu.size,
      this.renderer,
    );

    // Base Particle Texture
    this.gpgpu.baseParticleTexture = this.gpgpu.computation.createTexture();

    // Measure actual vertex bounds to auto-scale regardless of GLB export scale
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
    const targetSize = 3; // world units — longest axis fills this
    this.modelScale = longestSpan > 0 ? targetSize / longestSpan : 1;
    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    console.log("[FlowerField] vertex bounds:", {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
    });
    console.log(
      "[FlowerField] longestSpan:",
      longestSpan,
      "→ modelScale:",
      this.modelScale,
    );

    // Particle world offset — matches the hidden polygon model's position
    const offsetY = -1;
    const offsetZ = 1;
    const s = this.modelScale;

    // Fill particle texture with base positions (scaled + offset)
    for (let i = 0; i < this.baseGeometry.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      this.gpgpu.baseParticleTexture.image.data[i4 + 0] = posArr[i3 + 0] * s;
      this.gpgpu.baseParticleTexture.image.data[i4 + 1] =
        posArr[i3 + 1] * s + offsetY;
      this.gpgpu.baseParticleTexture.image.data[i4 + 2] =
        posArr[i3 + 2] * s + offsetZ;
      // Alpha: randomised initial life so particles don't all reset simultaneously
      this.gpgpu.baseParticleTexture.image.data[i4 + 3] = Math.random();
    }

    // Particle Variable
    this.gpgpu.particleVariable = this.gpgpu.computation.addVariable(
      "uParticles",
      particleShader,
      this.gpgpu.baseParticleTexture,
    );
    this.gpgpu.computation.setVariableDependencies(
      this.gpgpu.particleVariable,
      [this.gpgpu.particleVariable],
    );

    // Uniforms on GPGPU
    this.gpgpu.particleVariable.material.uniforms.uTime = new Uniform(0);
    this.gpgpu.particleVariable.material.uniforms.uBase = new Uniform(
      this.gpgpu.baseParticleTexture,
    );
    this.gpgpu.particleVariable.material.uniforms.uDeltaTime = new Uniform(0);
    this.gpgpu.particleVariable.material.uniforms.uFieldInfluence = new Uniform(
      0.5,
    );

    // Init
    this.gpgpu.computation.init();

    // Debug plane (hidden by default — toggle visible for debugging)
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
      // Hide the raw polygon mesh — particles are the display
      modelScene.visible = false;
      this.scene.add(modelScene);
      modelScene.position.z = 1;
      modelScene.position.y = -1;
    }

    // Build the particle Points object and add it to the scene
    this.setParticles();
    this.setDebug();
  }

  setParticles() {
    this.particles = {};

    // Create empty geometry
    this.particles.geometry = new BufferGeometry();

    // Create particle UV array for GPGPU texture lookup
    const particlesUvArray = new Float32Array(this.baseGeometry.count * 2);
    const sizesArray = new Float32Array(this.baseGeometry.count);

    for (let y = 0; y < this.gpgpu.size; y++) {
      for (let x = 0; x < this.gpgpu.size; x++) {
        const i = y * this.gpgpu.size + x;
        const i2 = i * 2;

        // Particle UV coordinates for texture lookup
        const uvX = (x + 0.5) / this.gpgpu.size;
        const uvY = (y + 0.5) / this.gpgpu.size;

        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;

        sizesArray[i] = 0.5 + Math.random() * 0.5;
      }
    }

    // Set attributes
    this.particles.geometry.setAttribute(
      "aParticlesUv",
      new BufferAttribute(particlesUvArray, 2),
    );
    this.particles.geometry.setAttribute(
      "aSize",
      new BufferAttribute(sizesArray, 1),
    );
    this.particles.geometry.setAttribute(
      "aColor",
      this.baseGeometry.instance.attributes.color,
    );

    // Material
    this.particles.material = new ShaderMaterial({
      vertexShader: vertexParticles,
      fragmentShader: fragmentParticles,
      uniforms: {
        uSize: new Uniform(0.01),
        uParticlesTexture: new Uniform(),
        uResolution: new Uniform(
          new Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio,
          ),
        ),
      },
    });

    // Create points with empty geometry
    this.particles.points = new Points(
      this.particles.geometry,
      this.particles.material,
    );

    this.particles.geometry.setDrawRange(0, this.baseGeometry.count);
    this.scene.add(this.particles.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Flower Flow Field");

      this.debugFolder
        .add(this.particles.material.uniforms.uSize, "value")
        .min(0)
        .max(1)
        .step(0.001)
        .name("Particle Size");

      this.debugFolder
        .add(
          this.gpgpu.particleVariable.material.uniforms.uFieldInfluence,
          "value",
        )
        .min(0)
        .max(1)
        .step(0.001)
        .name("Flow Field Influence");

      // Toggle GPGPU render target texture plane (for texture debugging)
      this.debugFolder
        .add(this.gpgpu.debug.material, "visible")
        .name("Show GPGPU Texture");
    }
  }

  update(time) {
    if (!this.gpgpu || !this.particles) return;

    // Both in seconds — shader scales time internally with * 0.2
    this.gpgpu.particleVariable.material.uniforms.uTime.value =
      time.elapsedTime * 0.001;
    this.gpgpu.particleVariable.material.uniforms.uDeltaTime.value =
      time.deltaTime * 0.001;

    // Run GPGPU simulation step
    this.gpgpu.computation.compute();

    // Feed the updated texture into the particle render material
    this.particles.material.uniforms.uParticlesTexture.value =
      this.gpgpu.computation.getCurrentRenderTarget(
        this.gpgpu.particleVariable,
      ).texture;
  }

  destroy() {
    // Clean up lil-gui debug folder
    this.debugFolder?.destroy();
    if (this.gpgpu) {
      this.scene.remove(this.gpgpu.debug);
      this.gpgpu.debug.geometry.dispose();
      this.gpgpu.debug.material.dispose();

      if (this.gpgpu.computation) {
        this.gpgpu.computation.dispose?.();
      }

      if (this.gpgpu.baseParticleTexture) {
        this.gpgpu.baseParticleTexture.dispose();
      }
    }

    if (this.particles) {
      this.scene.remove(this.particles.points);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }

    // Remove the loaded GLTF scene
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
