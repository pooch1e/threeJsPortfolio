import * as THREE from 'three';

export class ThreeJsShader {
  constructor(shaderExperience) {
    this.shaderExperience = shaderExperience;
    this.world = this.shaderExperience.world;
    this.scene = this.world.scene;

    this.setShader();
  }

  setShader() {
    const shaderMaterial = new THREE.RawShaderMaterial({
      vertexShader: ,
      fragmentShader: ,
    });

    this.scene.add(shaderMaterial);
  }
}
