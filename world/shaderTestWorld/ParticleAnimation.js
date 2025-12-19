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

    // Setup

    this.glowTexture = this.resources.items.glowTexture;
    this.imageTexture = this.resources.items.joelTypeTexture;

    this.displacementParams = {
      screenCursor: new THREE.Vector2(9999, 9999),
      canvasWidth: 128,
      canvasHeight: 128,
      drawImage: new Image(),
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

  setInteractivePlane() {
    this.interactivePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ color: 'red', visible: false })
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
          // Convert UV to canvas coordinates
          const canvasX = intersect.uv.x * this.canvas2D.width;
          const canvasY = (1 - intersect.uv.y) * this.canvas2D.height;

          //draw here
          const size = 32;
          this.ctx2D.drawImage(
            this.glowTexture.image,
            canvasX - size / 2,
            canvasY - size / 2,
            size,
            size
          );
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
