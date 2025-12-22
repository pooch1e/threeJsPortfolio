import * as THREE from 'three';
import morphingVertex from './shaders/morphingParticles/vertex.glsl';
import morphingFragment from './shaders/morphingParticles/fragment.glsl';

import gsap from 'gsap';

export default class ParticleMorph {
  constructor(world) {
    try {
      this.world = world;
      this.scene = world.scene;
      this.resources = this.world.resources;
      this.sizes = this.world.shaderExperience.sizes;
      this.debug = this.world.shaderExperience.debug;

      // Setup
      this.particles = {};
      this.models = this.resources.items.dracoModels;

      // Models
      this.setParticles();
      this.setModels();
      this.setDebug();
    } catch (error) {
      console.error('ParticleMorph Error:', error);
      throw error;
    }
  }

  setParticles() {
    // Geometry
    this.particles.geometry = new THREE.SphereGeometry(3);
    this.particles.geometry.setIndex(null);

    // Attributes
    // Will control morphing with poitions attribute - new pos attribute and a float transtition which I will animate
    this.positionArray = new Float32Array();

    // Material
    this.particles.material = new THREE.ShaderMaterial({
      vertexShader: morphingVertex,
      fragmentShader: morphingFragment,
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

  setModels() {
    //extract positions on models
    this.modelPositions = this.models.scene.children.map((child) => {
      return child.geometry.attributes.position;
    });

    let maxCount = 0;
    for (const position of this.modelPositions) {
      if (maxCount < position.count) maxCount = position.count;
    }

    
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
