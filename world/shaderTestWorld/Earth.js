import * as THREE from 'three';
import earthVertex from './shaders/earth/vertex.glsl';
import earthFragment from './shaders/earth/fragment.glsl';

import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl';
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl';

export default class Earth {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = world.resources;

    // Textures
    this.earthDayTexture = this.resources.items.earthTextures[0];
    this.earthDayTexture.colorSpace = THREE.SRGBColorSpace;
    this.earthDayTexture.anisotropy = 6;

    this.earthNightTexture = this.resources.items.earthTextures[1];
    this.earthNightTexture.colorSpace = THREE.SRGBColorSpace;
    this.earthNightTexture.anisotropy = 6;

    this.earthSpecularCloudTexture = this.resources.items.earthTextures[2];
    this.earthSpecularCloudTexture.anisotropy = 6;

    // Params
    this.earthParams = {
      atmosphereDayColor: '#00aaff',
      atmosphereTwilightColor: '#ff6600',
    };

    // Setup
    this.setModel();
    this.setAtmosphere();
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
        uAtmosphereDayColor: new THREE.Uniform(
          new THREE.Color(this.earthParams.atmosphereDayColor)
        ),
        uAtmosphereTwilightColor: new THREE.Uniform(
          new THREE.Color(this.earthParams.atmosphereTwilightColor)
        ),
      },
    });

    this.earthMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.scene.add(this.earthMesh);
  }

  setAtmosphere() {
    this.atmosGeometry = new THREE.SphereGeometry(2, 64, 64);
    this.atmosMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(
          new THREE.Color(this.earthParams.atmosphereDayColor)
        ),
        uAtmosphereTwilightColor: new THREE.Uniform(
          new THREE.Color(this.earthParams.atmosphereTwilightColor)
        ),
      },
    });
    this.atmosMesh = new THREE.Mesh(this.atmosGeometry, this.atmosMaterial);

    this.atmosMesh.scale.set(1.04, 1.04, 1.04);

    this.scene.add(this.atmosMesh);
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
      this.sphereMaterial.uniforms.uSunDirection.value.copy(this.sunDirection);
      this.atmosMaterial.uniforms.uSunDirection.value.copy(this.sunDirection);
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
        .onChange(() => this.updateSun());

      this.debugFolder
        .add(this.sunSpherical, 'theta')
        .min(-Math.PI)
        .max(Math.PI)
        .onChange(() => this.updateSun());

      this.debugFolder
        .addColor(this.earthParams, 'atmosphereDayColor')
        .onChange(() => {
          this.sphereMaterial.uniforms.uAtmosphereDayColor.value.set(
            this.earthParams.atmosphereDayColor
          );
          this.atmosMaterial.uniforms.uAtmosphereDayColor.value.set(
            this.earthParams.atmosphereDayColor
          );
        });
      this.debugFolder
        .addColor(this.earthParams, 'atmosphereTwilightColor')
        .onChange(() => {
          this.sphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
            this.earthParams.atmosphereTwilightColor
          );
          this.atmosMaterial.uniforms.uAtmosphereTwilightColor.value.set(
            this.earthParams.atmosphereTwilightColor
          );
        });
    }
  }

  update(time) {
    if (time && this.sphereMaterial) {
      this.earthMesh.rotation.y = time.elapsedTime * 0.0002;
    }
  }

  destroy() {
    if (this.earthMesh) {
      this.scene.remove(this.earthMesh);
      this.sphereGeometry?.dispose();
      this.sphereMaterial?.dispose();
    }

    if (this.debugSun) {
      this.scene.remove(this.debugSun);
    }

    if (this.atmosMesh) {
      this.scene.remove(this.atmosMesh);
      this.atmosGeometry?.dispose();
      this.atmosMaterial?.dispose();
    }
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
