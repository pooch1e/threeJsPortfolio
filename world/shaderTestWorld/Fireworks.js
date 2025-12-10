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
      radius: 1,
      color: new THREE.Color('#8affff'),
    };

    this.createFirework(
      this.parameters.count,
      this.parameters.positionVector,
      this.parameters.size,
      this.parameters.texture,
      this.parameters.radius,
      this.parameters.color
    );
    this.setDebug();
  }

  createFirework(count, positionVector, size, texture, radius, color) {
    // Geometry

    const sizesArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      sizesArray[i] = Math.random() - 0.5;
    }

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const spherical = new THREE.Spherical(
        radius * (0.75 + Math.random() * 0.25),
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );

      const position = new THREE.Vector3();
      position.setFromSpherical(spherical);

      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
    }

    this.bufferGeometry = new THREE.BufferGeometry();
    this.bufferGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.bufferGeometry.setAttribute(
      'aSize',
      new THREE.Float32BufferAttribute(sizesArray, 1)
    );

    // Material
    texture.flipY = false;

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: fireworkVertex,
      fragmentShader: fireworkFragment,
      uniforms: {
        uSize: new THREE.Uniform(size),
        uResolution: new THREE.Uniform(this.parameters.resolution),
        uTexture: new THREE.Uniform(texture),
        uColor: new THREE.Uniform(color),
      },
    });

    this.pointMesh = new THREE.Points(this.bufferGeometry, this.material);
    this.pointMesh.position.copy(positionVector);
    this.scene.add(this.pointMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('FireWorks');
      this.debugFolder.addColor(this.parameters, 'color').onChange(() => {
        this.material.uniforms.uColor.value.set(this.parameters.color)
      })
    }
  }

  update(time) {
    if (this.time) {
      console.log('time test');
    }
  }
}
