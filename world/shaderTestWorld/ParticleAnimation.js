import * as THREE from 'three';
import particlesVertexShader from './shaders/particles/vertex.glsl';
import particlesFragmentShader from './shaders/particles/fragment.glsl';

export default class ParticleAnimation {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = this.world.resources;

    // Setup

    this.glowTexture = this.resources.items.glowTexture;
    this.imageTexture = this.resources.items.joelTypeTexture;

    this.setParticles();
  }

  setParticles() {
    this.particlesGeometry = new THREE.PlaneGeometry(10, 10, 32, 32);

    this.particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.world.shaderExperience.sizes.width *
              this.world.shaderExperience.sizes.pixelRatio,
            this.world.shaderExperience.sizes.height *
              this.world.shaderExperience.sizes.pixelRatio
          )
        ),
      },
    });
    this.particles = new THREE.Points(
      this.particlesGeometry,
      this.particlesMaterial
    );
    this.scene.add(this.particles);
  }

  update(time) {}

  destroy() {}
}
