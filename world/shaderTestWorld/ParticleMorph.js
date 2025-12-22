import * as THREE from 'three';
import morphingParticlesVertex from './shaders/morphingParticles/vertex.glsl';
import morphingParticlesFragment from './shaders/morphingParticles/fragment.glsl';
import gsap from 'gsap';
export default class ParticleMorph {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = this.world.resources;
    this.sizes = this.world.shaderExperience.sizes;
    this.debug = this.world.shaderExperience.debug;

    // Setup
    this.particles = {};

    // Models
    this.setModels();
    this.setDebug();
  }

  setModels() {
    // Geometry
    this.particles.geometry = new THREE.SphereGeometry(3);
    this.particles.geometry.setIndex(null);

    // Attributes
    this.positionArray = new Float32Array();

    // Material
    this.particles.material = new THREE.ShaderMaterial({
      vertexShader: morphingParticlesVertex,
      fragmentShader: morphingParticlesFragment,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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
    this.particles.points = new THREE.Points(
      this.particles.geometry,
      this.particles.material
    );
    this.scene.add(this.particles.points);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Particle Morph');
    }
  }

  update(time) {
    if (time) {
    }
  }
}
