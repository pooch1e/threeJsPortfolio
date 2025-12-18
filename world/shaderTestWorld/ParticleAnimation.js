import * as THREE from 'three';
import particlesVertexShader from './shaders/particles/vertex.glsl';
import particlesFragmentShader from './shaders/particles/fragment.glsl';

export default class ParticleAnimation {
  constructor(world, canvas2D = null) {
    this.world = world;
    this.scene = world.scene;
    this.resources = this.world.resources;
    this.canvas2D = canvas2D;
    this.ctx2D = canvas2D ? canvas2D.getContext('2d') : null;

    // Setup

    this.imageTexture = this.resources.items.joelTypeTexture;

    this.displacementParams = {
      canvasWidth: 128,
      canvasHeight: 128,
      glowImage: new Image(),
      imageSrc: '/static/textures/glow/glow.png',
    };

    this.ctx2D.fillRect(
      0,
      0,
      this.displacementParams.canvasWidth,
      this.displacementParams.canvasHeight
    );

    this.setParticles();
    this.setInteractivePane();
  }

  setParticles() {
    this.particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);

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
        uPictureTexture: new THREE.Uniform(this.imageTexture),
      },
    });
    this.particles = new THREE.Points(
      this.particlesGeometry,
      this.particlesMaterial
    );
    this.scene.add(this.particles);
  }

  setInteractivePane() {
    this.displacementParams.interactivePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ color: 'red' })
    );
    this.scene.add(this.displacementParams.interactivePlane)
  }

  update(time) {}

  destroy() {}
}
