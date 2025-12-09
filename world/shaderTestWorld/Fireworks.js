import * as THREE from 'three';
import fireworkVertex from './shaders/fireworks/vertex.glsl';
import fireworkFragment from './shaders/fireworks/fragment.glsl';

export default class Fireworks {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.sizes = this.world.shaderExperience.sizes;
    this.resources = this.world.resources;

    // Resource setup
    this.resource = this.resources.items.fireworksTextures;
    

    // Config
    this.parameters = {
      count: 100,
      positionVector: new THREE.Vector3(),
      size: 0.5,
      resolution: new THREE.Vector2(this.sizes.width, this.sizes.height),
      texture: this.resource[7],
    };

    this.createFirework(
      this.parameters.count,
      this.parameters.positionVector,
      this.parameters.size,
      this.parameters.texture
    );
    this.setDebug();
  }

  createFirework(count, positionVector, size, texture) {
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
    texture.flipY = false;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: fireworkVertex,
      fragmentShader: fireworkFragment,
      uniforms: {
        uSize: new THREE.Uniform(size),
        uResolution: new THREE.Uniform(this.parameters.resolution),
        uTexture: new THREE.Uniform(texture),
      },
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
