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
    this.setSun();
    this.updateSun();
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
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
      },
    });

    this.earthMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.scene.add(this.earthMesh);
  }

  setSun() {
    // Debug Sun
    this.debugSun = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicMaterial()
    );

    this.sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
    this.sunDirection = new THREE.Vector3();

    this.scene.add(this.debugSun);
  }

  updateSun() {
    if (this.sunDirection) {
      this.sunDirection.setFromSpherical(this.sunSpherical);

      // Debug
      this.debugSun.position.copy(this.sunDirection).multiplyScalar(5);

      // Update sun
      console.log(this.sphereMaterial.uniforms.uSunDirection, 'undefined?')
      this.sphereMaterial.uniforms.uSunDirection.clone(this.sunDirection);
    }
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Earth Shader');

      // Debug Sun Spherical
      this.debugFolder
        .add(this.sunSpherical, 'phi')
        .min(0)
        .max(Math.PI)
        .onChange(this.updateSun);

      this.debugFolder
        .add(this.sunSpherical, 'theta')
        .min(-Math.PI)
        .max(Math.PI)
        .onChange(this.updateSun);
    }
  }

  update(time) {
    if (this.time && this.sphereMaterial) {
      this.earthMesh.rotation.y += time.elapsedTime;
    }
  }

  destroy() {}
}
