import * as THREE from 'three';
import testVertexShader from './shaders/vertex.glsl';
import testFragmentShader from './shaders/fragment.glsl';
export class ThreeJsShader {
  constructor(world) {
    this.world = world;

    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;

    this.setShader();
    this.setDebug();
  }

  setShader() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 50, 50);
    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: testVertexShader,
      fragmentShader: testFragmentShader,
      transparent: true,
      uniforms: {
        uFrequency: { value: new THREE.Vector2(10, 5) },
        uTime: { value: 0 },
        uAlpha: { value: 1.0 },
        uMix: { value: 1.0 },
      },
    });

    const count = this.geometry.attributes.position.count;
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      randoms[i] = Math.random();
    }

    this.geometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randoms, 1)
    );

    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);

    this.scene.add(this.mesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Shader GUI');

      this.debugFolder
        .add(this.shaderMaterial.uniforms.uFrequency.value, 'x')
        .min(0)
        .max(20)
        .step(0.01)
        .name('frequencyX');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uFrequency.value, 'y')
        .min(0)
        .max(20)
        .step(0.01)
        .name('frequencyY');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uAlpha, 'value')
        .min(0)
        .max(1.0)
        .step(0.01)
        .name('Alpha');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uMix, 'value')
        .min(0)
        .max(1.0)
        .step(0.001)
        .name('Mix');
    }
  }

  update(time) {
    if (time) {
      //scale down speed by * by 0.00
      this.shaderMaterial.uniforms.uTime.value = time.elapsedTime * 0.002;
    }
  }
}
