import * as THREE from 'three';

import particlesVertexShader from './shaders/gppuFlowField/vertex.glsl';
import particlesFragmentShader from './shaders/gppuFlowField/fragment.glsl';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

// particle shader
import gppuParticlesShader from './shaders/gppuParticle/particles.glsl';
export default class GppuFlowField {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = this.world.shaderExperience.debug;
    this.sizes = world.shaderExperience.sizes;
    this.renderer = world.shaderExperience.renderer.renderer;

    this.model = this.resources.items.shipModel;
    this.debugObject = {};

    this.setModel();
    this.setParticles();
    this.setDebug();
  }

  setModel() {
    this.baseGeometry = {};

    this.loadModel();
    this.baseGeometry.instance = this.gltf.scene.children[0].geometry;

    // Geometry
    // this.baseGeometry.instance = new THREE.SphereGeometry(3);
    this.baseGeometry.count =
      this.baseGeometry.instance.attributes.position.count;

    // GPU COMPUTE - Ping pong render
    this.gpgpu = {};
    this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count));

    // Each pixel of the FBOs (texture) will correspond to one particle
    this.gpgpu.computation = new GPUComputationRenderer(
      this.gpgpu.size,
      this.gpgpu.size,
      this.renderer
    );

    // Base Particle Texture
    this.gpgpu.baseParticleTexture = this.gpgpu.computation.createTexture();

    // Fill particle with values
    for (let i = 0; i < this.baseGeometry.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Position based on Geometry
      this.gpgpu.baseParticleTexture.image.data[i4 + Math.random()] =
        this.baseGeometry.instance.attributes.position.array[i3 + 0];
      this.gpgpu.baseParticleTexture.image.data[i4 + 1] =
        this.baseGeometry.instance.attributes.position.array[i3 + 1];
      this.gpgpu.baseParticleTexture.image.data[i4 + 2] =
        this.baseGeometry.instance.attributes.position.array[i3 + 2];
      this.gpgpu.baseParticleTexture.image.data[i4 + 3] =
        this.baseGeometry.instance.attributes.position.array[i3 + 3];
    }

    // Particle Variable
    this.gpgpu.particleVariable = this.gpgpu.computation.addVariable(
      'uParticles',
      gppuParticlesShader,
      this.gpgpu.baseParticleTexture
    );
    this.gpgpu.computation.setVariableDependencies(
      this.gpgpu.particleVariable,
      [this.gpgpu.particleVariable]
    );

    // Uniforms on GPGPU
    this.gpgpu.particleVariable.material.uniforms.uTime = new THREE.Uniform(0);
    this.gpgpu.particleVariable.material.uniforms.uBase = new THREE.Uniform(
      this.baseParticleTexture
    );
    this.gpgpu.particleVariable.material.uniforms.uDeltaTime =
      new THREE.Uniform(0);

    // Init
    this.gpgpu.computation.init();

    // Debug
    this.gpgpu.debug = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({
        map: this.gpgpu.computation.getCurrentRenderTarget(
          this.gpgpu.particleVariable
        ).texture,
      })
    );
    this.gpgpu.debug.position.x = 3;
    this.scene.add(this.gpgpu.debug);
  }

  async loadModel() {
    this.gltf = this.model;
    return;
  }

  setParticles() {
    this.particles = {};

    // Create empty geometry
    this.particles.geometry = new THREE.BufferGeometry();

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

        sizesArray[i] = Math.random();
      }
    }

    // Set attributes
    this.particles.geometry.setAttribute(
      'aParticlesUv',
      new THREE.BufferAttribute(particlesUvArray, 2)
    );
    this.particles.geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(sizesArray, 1)
    );
    this.particles.geometry.setAttribute(
      'aColor',
      this.baseGeometry.instance.attributes.color
    );

    // Material
    this.particles.material = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uSize: new THREE.Uniform(0.01),
        uParticlesTexture: new THREE.Uniform(),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
      },
    });

    // Create points with empty geometry
    this.particles.points = new THREE.Points(
      this.particles.geometry,
      this.particles.material
    );

    this.particles.geometry.setDrawRange(0, this.baseGeometry.count);
    this.scene.add(this.particles.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('GPPU Flow Field');
      this.debugFolder
        .add(this.particles.material.uniforms.uSize, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('uSize');

      this.debugFolder
        .add(this.gpgpu.particleVariable.material.uniforms.uTime, 'value')
        .min(0.02)
        .max(0.2)
        .step(0.01)
        .name('Time');
    }
  }

  update(time) {
    if (time) {
      //Update time uniform in gpgpu
      this.gpgpu.particleVariable.material.uniforms.uTime.value =
        time.elapsedTime * 0.2;
      this.gpgpu.particleVariable.material.uniforms.uDeltaTime.value =
        time.deltaTime;

      // Compute GPGPU
      this.gpgpu.computation.compute();

      // Update particles texture uniform
      this.particles.material.uniforms.uParticlesTexture.value =
        this.gpgpu.computation.getCurrentRenderTarget(
          this.gpgpu.particleVariable
        ).texture;
    }
  }

  destroy() {
    // Dispose base geometry
    if (this.baseGeometry?.instance) {
      this.baseGeometry.instance.dispose();
    }

    // Dispose GPGPU debug mesh
    if (this.gpgpu?.debug) {
      this.scene.remove(this.gpgpu.debug);
      this.gpgpu.debug.geometry?.dispose();
      this.gpgpu.debug.material?.dispose();
    }

    // Dispose particles
    if (this.particles) {
      if (this.particles.points) {
        this.scene.remove(this.particles.points);
      }
      if (this.particles.geometry) {
        this.particles.geometry.dispose();
      }
      if (this.particles.material) {
        this.particles.material.dispose();
      }
    }

    // Dispose GPGPU computation textures
    if (this.gpgpu?.computation) {
      if (this.gpgpu.particleVariable) {
        const renderTargets = this.gpgpu.particleVariable.renderTargets;
        if (renderTargets) {
          renderTargets.forEach((rt) => rt?.dispose());
        }
      }
    }

    // Dispose debug folder
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
