import * as THREE from 'three';

import particlesVertexShader from './shaders/gppuFlowField/vertex.glsl';
import particlesFragmentShader from './shaders/gppuFlowField/fragment.glsl';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

// particle shader
import gppiParticleShader from './shaders/gppuuParticle/particles.glsl';
export default class GppuFlowField {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = this.world.shaderExperience.debug;
    this.sizes = world.shaderExperience.sizes;
    this.renderer = world.shaderExperience.render;

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

    // Particle Variable
    this.gpgpu.particleVariable = this.gpgpu.computation.addVariable(
      'uParticles',
      gppiParticleShader,
      this.gpgpu.baseParticleTexture
    );
    this.gpgpu.computation.setVariableDependencies(
      this.gpgpu.particleVariable,
      [this.gpgpu.particleVariable]
    );

    // Debug
    this.gpgpu.debug = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial()
    );
    this.gpgpu.debug.position.x = 3;
    this.scene.add(this.gpgpu.debug);

    // Init
    this.gpgpu.computation.init();

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

  destroy() {}
}
