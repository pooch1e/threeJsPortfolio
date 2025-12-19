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
    this.mouse = this.world.shaderExperience.mouse;
    this.raycaster = new THREE.Raycaster();
    this.canvasTexture = new THREE.CanvasTexture(this.canvas2D);

    // Setup

    this.glowTexture = this.resources.items.glowTexture;
    this.imageTexture = this.resources.items.joelTypeTexture;

    this.displacementParams = {
      screenCursor: new THREE.Vector2(9999, 9999),
      prevScreenCursor: new THREE.Vector2(9999, 9999),
      canvasWidth: 128,
      canvasHeight: 128,
    };

    this.setup2DCanvas();
    this.setParticles();
    this.setInteractivePlane();
    this.setupMouseEvents();
  }

  setup2DCanvas() {
    if (this.ctx2D) {
      this.canvas2D.width = this.displacementParams.canvasWidth;
      this.canvas2D.height = this.displacementParams.canvasHeight;

      this.ctx2D.fillStyle = 'black';
      this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
    }
  }

  setupMouseEvents() {
    this.handleMouseMove = (position, event) => {
      // Save normalized screen coordinates for raycaster
      this.displacementParams.screenCursor.copy(position);
    };

    this.mouse.on('move', this.handleMouseMove);
  }

  setParticles() {
    this.particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
    this.particlesGeometry.setIndex(null); // improve performance by not rendering all vertices necessary
    this.particlesGeometry.deleteAttribute('normal');

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
        uDisplacementTexture: new THREE.Uniform(this.canvasTexture),
      },
    });

    // Attributes
    const intensitiesArray = new Float32Array(
      this.particlesGeometry.attributes.position.count
    );

    const anglesArray = new Float32Array(
      this.particlesGeometry.attributes.position.count
    );

    for (let i = 0; i < this.particlesGeometry.attributes.position.count; i++) {
      intensitiesArray[i] = Math.random();
      anglesArray[i] = Math.random() * Math.PI * 2;
    }

    this.particlesGeometry.setAttribute(
      'aIntensity',
      new THREE.BufferAttribute(intensitiesArray, 1)
    );

    this.particlesGeometry.setAttribute(
      'aAngles',
      new THREE.BufferAttribute(anglesArray, 1)
    );

    this.particles = new THREE.Points(
      this.particlesGeometry,
      this.particlesMaterial
    );
    this.scene.add(this.particles);
  }

  setInteractivePlane() {
    this.interactivePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        color: 'red',
        visible: false,
        side: THREE.DoubleSide,
      })
    );
    this.scene.add(this.interactivePlane);
  }

  update(time) {
    if (this.raycaster && this.interactivePlane) {
      const camera =
        this.world.shaderExperience.camera.instance ||
        this.world.shaderExperience.camera.perspectiveCamera;

      this.raycaster.setFromCamera(
        this.displacementParams.screenCursor,
        camera
      );

      const intersections = this.raycaster.intersectObject(
        this.interactivePlane
      );

      if (intersections.length > 0) {
        const intersect = intersections[0];

        if (this.ctx2D && intersect.uv) {
          // fade out FIRST (before drawing new)
          this.ctx2D.globalCompositeOperation = 'source-over';
          this.ctx2D.globalAlpha = 0.02;
          this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);

          // Convert UV to canvas coordinates
          const canvasX = intersect.uv.x * this.canvas2D.width;
          const canvasY = (1 - intersect.uv.y) * this.canvas2D.height;

          //speedAlpha - calculate speed from cursor movement
          const cursorDistance =
            this.displacementParams.prevScreenCursor.distanceTo(
              this.displacementParams.screenCursor
            );

          this.displacementParams.prevScreenCursor.copy(
            this.displacementParams.screenCursor
          );

          // Scale alpha based on speed (distance is in NDC, typically 0-2)
          const alpha = Math.min(cursorDistance * 10.0, 1.0);

          //draw here
          this.ctx2D.globalCompositeOperation = 'lighten';
          const glowSize = this.displacementParams.canvasWidth * 0.25;
          this.ctx2D.globalAlpha = alpha;
          this.ctx2D.drawImage(
            this.glowTexture.image,
            canvasX - glowSize / 2,
            canvasY - glowSize / 2,
            glowSize,
            glowSize
          );

          this.canvasTexture.needsUpdate = true;
        }
      }
    }
  }

  destroy() {
    // Clean up mouse event listener
    if (this.mouse && this.handleMouseMove) {
      this.mouse.off('move', this.handleMouseMove);
    }
  }
}
