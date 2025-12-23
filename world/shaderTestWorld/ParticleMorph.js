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
      this.particles = {
        particlesMorph0: () => this.morph(0),
        particlesMorph1: () => this.morph(1),
        particlesMorph2: () => this.morph(2),
        particlesMorph3: () => this.morph(3),
      };
      this.models = this.resources.items.dracoModels;

      // Models
      // this.setParticles();
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
    // reset index to 0
    this.particles.index = 0;

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
        // change this to random index
        const randomIndex = Math.floor(positionAttr.count * Math.random()) * 3;
        paddedArray[i3 + 0] = originalArray[randomIndex + 0];
        paddedArray[i3 + 1] = originalArray[randomIndex + 1];
        paddedArray[i3 + 2] = originalArray[randomIndex + 2];
      }
      // Pad remaining with 0's

      this.modelPositions.push(new THREE.BufferAttribute(paddedArray, 3));
    }

    this.suzanneModelGeometry = new THREE.BufferGeometry();
    this.suzanneModelGeometry.setAttribute(
      'position',
      this.modelPositions[this.particles.index]
    );
    this.suzanneModelGeometry.setAttribute(
      'aTargetPosition',
      this.modelPositions[2]
    );

    this.suzanneModelMaterial = new THREE.ShaderMaterial({
      vertexShader: morphingVertex,
      fragmentShader: morphingFragment,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uSize: new THREE.Uniform(0.1),
        uProgress: new THREE.Uniform(0),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
      },
    });

    this.suzanneMesh = new THREE.Points(
      this.suzanneModelGeometry,
      this.suzanneModelMaterial
    );
    this.scene.add(this.suzanneMesh);
  }

  morph(index) {
    // update attr
    this.suzanneModelGeometry.setAttribute(
      'position',
      this.modelPositions[this.particles.index]
    );
    this.suzanneModelGeometry.setAttribute(
      'aTargetPosition',
      this.modelPositions[index]
    );

    gsap.fromTo(
      this.suzanneModelMaterial.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: 3, ease: 'linear' }
    );

    this.particles.index = index;
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Particle Morph');

      this.debugFolder
        .add(this.suzanneModelMaterial.uniforms.uProgress, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('Tranform Particles');

      this.debugFolder.add(this.particles, 'particlesMorph0');
      this.debugFolder.add(this.particles, 'particlesMorph1');
      this.debugFolder.add(this.particles, 'particlesMorph2');
      this.debugFolder.add(this.particles, 'particlesMorph3');
    }
  }

  update(time) {
    if (time) {
    }
  }
}
