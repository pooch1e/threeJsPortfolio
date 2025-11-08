import * as THREE from 'three';
import waterVertexShader from './shaders/water/vertex.glsl';
import waterFragmentShader from './shaders/water/fragment.glsl';

export class Waves {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;

    this.setShader();
    this.setDebug();
  }

  setShader() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 128, 128);
    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
    });
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Waves GUI');
    }
  }

  update(time) {
    if (time) {
      //scale down speed by * by 0.00
      this.shaderMaterial.uniforms.uTime.value = time.elapsedTime * 0.002;
    }
  }
}
