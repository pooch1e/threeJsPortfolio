import * as THREE from 'three';
import fireworkVertex from './shaders/fireworks/vertex.glsl';
import fireworkFragment from './shaders/fireworks/fragment.glsl';

export default class Fireworks {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;

    // Config
    this.parameters = {
      count: 100,
      positionVector: new THREE.Vector3(),
    };

    // Setup
    this.createFirework(this.parameters.count, this.parameters.positionVector);
    this.setDebug();
  }

  createFirework(count, positionVector) {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = Math.random() - 0.5;
      positions[i3 + 1] = Math.random() - 0.5;
      positions[i3 + 2] = Math.random() - 0.5;
    }

    this.bufferGeometry = new THREE.BufferGeometry();
    this.bufferGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    // Material
    this.material = new THREE.ShaderMaterial({
      vertexShader: fireworkVertex,
      fragmentShader: fireworkFragment,
    });

    this.pointMesh = new THREE.Points(this.bufferGeometry, this.material);
    this.pointMesh.position.copy(positionVector);
    this.scene.add(this.pointMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('FireWorks');
    }
  }

  update(time) {
    if (this.time) {
      console.log('time test');
    }
  }
}
