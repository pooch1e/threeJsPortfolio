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
    // Extract position attributes from all meshes in the loaded model
    const positionAttributes = [];
    this.models.scene.traverse((child) => {
      if (child.isMesh && child.geometry?.attributes?.position) {
        positionAttributes.push(child.geometry.attributes.position);
      }
    });

    if (positionAttributes.length === 0) {
      console.warn('No geometries found in draco model');
      return;
    }

    // Find max vertex count across all geometries
    this.particles.maxCount = 0;
    for (const attr of positionAttributes) {
      if (attr.count > this.particles.maxCount) {
        this.particles.maxCount = attr.count;
      }
    }

    // Harmonise position arrays to be same size - pad with 0's if not same size
    this.modelPositions = [];
    for (const positionAttr of positionAttributes) {
      const originalArray = positionAttr.array;
      const paddedArray = new Float32Array(this.particles.maxCount * 3);

      for (let i = 0; i < positionAttr.count; i++) {
        const i3 = i * 3;
        paddedArray[i3 + 0] = originalArray[i3 + 0];
        paddedArray[i3 + 1] = originalArray[i3 + 1];
        paddedArray[i3 + 2] = originalArray[i3 + 2];
      }
      // Pad remaining with 0's

      this.modelPositions.push(new THREE.BufferAttribute(paddedArray, 3));
    }

    this.suzanneModelGeometry = new THREE.BufferGeometry();
    this.suzanneModelGeometry.setAttribute('position', this.modelPositions[1]);
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
