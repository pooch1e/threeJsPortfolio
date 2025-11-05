import * as THREE from 'three';
import testVertexShader from '../shaderTestWorld/shaders/vertex.glsl';
import testFragmentShader from '../shaderTestWorld/shaders/fragmentShader.glsl';
export class ThreeJsShader {
  constructor(shaderExperience) {
    this.shaderExperience = shaderExperience;
    this.world = this.shaderExperience.world;
    this.scene = this.world.scene;

    this.setShader();
  }

  setShader() {
    const shaderMaterial = new THREE.RawShaderMaterial({
      vertexShader: testVertexShader,
      fragmentShader: testFragmentShader,
    });

    this.scene.add(shaderMaterial);
  }
}
