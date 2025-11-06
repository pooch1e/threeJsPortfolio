import * as THREE from 'three';
import testVertexShader from './shaders/vertex.glsl';
import testFragmentShader from './shaders/fragment.glsl';
export class ThreeJsShader {
  constructor(world) {
    this.world = world;

    this.scene = this.world.scene;

    this.setShader();
  }

  setShader() {
    const geometry = new THREE.PlaneGeometry(1, 1, 50, 50);
    const shaderMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: testVertexShader,
      fragmentShader: testFragmentShader,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geometry, shaderMaterial);

    this.scene.add(mesh);
  }
}
