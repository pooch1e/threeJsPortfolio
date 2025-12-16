import * as THREE from 'three';
import earthVertex from './shaders/earth/vertex.glsl';
import earthFragment from './shaders/earth/fragment.glsl';
export default class Earth {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = world.resources;

    // Textures
    this.earthDayTexture = this.resources.items.earthTextures[0];
    this.earthDayTexture.colorSpace = THREE.SRGBColorSpace;

    this.earthNightTexture = this.resources.items.earthTextures[1];
    this.earthNightTexture.colorSpace = THREE.SRGBColorSpace;

    this.earthSpecularCloudTexture = this.resources.items.earthTextures[2];

    // Setup
    this.setModel();
    this.setDebug();
  }

  setModel() {
    this.sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
    this.sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertex,
      fragmentShader: earthFragment,
      uniforms: {
        uDayTexture: new THREE.Uniform(this.earthDayTexture),
        uNightTexture: new THREE.Uniform(this.earthNightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(
          this.earthSpecularCloudTexture
        ),
      },
    });

    this.earthMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.scene.add(this.earthMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Earth Shader');
    }
  }

  update(time) {}

  destroy() {}
}
