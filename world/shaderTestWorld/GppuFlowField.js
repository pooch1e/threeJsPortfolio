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
    this.setDebug();
  }

  setModel() {
    this.baseGeometry = {};

    // Geometry
    this.baseGeometry.instance = new THREE.SphereGeometry(3);
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
      this.gpgpu.baseParticleTexture.image.data[i4 + 0] =
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

    // Material
    this.material = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uSize: new THREE.Uniform(0.1),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
      },
    });

    // Points
    this.points = new THREE.Points(this.baseGeometry.instance, this.material);
    this.scene.add(this.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('GPPU Flow Field');
      this.debugFolder
        .add(this.material.uniforms.uSize, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('uSize');
    }
  }

  update(time) {
    if (time) {
      this.gpgpu.computation.compute(); // may need to check this in renderer
    }
  }

  destroy() {
    if (this.baseGeometry?.instance) {
      this.baseGeometry.instance.dispose();
    }

    if (this.gpgpu?.debug) {
      this.scene.remove(this.gpgpu.debug);
      this.gpgpu.debug.geometry?.dispose();
      this.gpgpu.debug.material?.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    if (this.points) {
      this.scene.remove(this.points);
    }

    // Dispose GPGPU computation textures
    if (this.gpgpu?.computation) {
      // Dispose render targets created by GPUComputationRenderer
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
