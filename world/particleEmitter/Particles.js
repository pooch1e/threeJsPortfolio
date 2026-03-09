import * as THREE from 'three';
export class Particles {
  constructor(world) {
    this.world = world;
    this.debug = world.particleEmitterExperience.debug;
    this.scene = this.world.scene;
    this.sizes = this.world.particleEmitterExperience.sizes;
    this.width = this.sizes.width;
    this.height = this.sizes.height;
    this.mouse = this.world.mouse;

    this.params = {
      mousePos: new THREE.Vector2(),
    };

    // figure out how to disable orbital camera just for this file

    this.setupMouseEvents();
    this.setMesh();
    this.setDebug();
  }

  setMesh() {
    this.circleGeometry = new THREE.CircleGeometry(0.5, 32);

    this.circleMaterial = new THREE.MeshBasicMaterial();
    this.circleMesh = new THREE.Mesh(this.circleGeometry, this.circleMaterial);

    this.scene.add(this.circleMesh);
  }

  setupMouseEvents() {
    this.handleMouseMove = (position, event) => {
      // Save normalized screen coordinates for raycaster
      this.params.mousePos.copy(position);
    };

    this.mouse.on('move', this.handleMouseMove);
  }

  update(time) {
    if (time) {
      this.circleMesh.position.x = this.params.mousePos.x * 2;
      this.circleMesh.position.y = this.params.mousePos.y * 2;
    }
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Particle Emitter');
    }
  }
}
