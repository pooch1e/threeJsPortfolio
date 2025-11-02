import * as THREE from 'three';
export class Environment {
  constructor(worldView) {
    this.worldView = worldView;
    this.scene = this.worldView.scene;
    this.resources = this.worldView.resources;
    this.world = this.worldView.world;
    this.debug = this.world.debug;

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('environment');
    }

    //setup
    this.setSunLight();
    this.setEnvironmentMap();
  }

  setSunLight() {
    this.sunLight = new THREE.DirectionalLight('#ffffff', 4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.far = 15;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.normalBias = 0.05;
    this.sunLight.position.set(3, 3, -2.25);
    this.scene.add(this.sunLight);
  }
  setEnvironmentMap() {
    this.environmentMap = {};
    this.environmentMap.intensity = 0.4;
    this.environmentMap.texture = this.resources.items.environmentMapTexture;
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace;

    this.scene.environment = this.environmentMap.texture;

    this.environmentMap.updateMaterials = () => {
      this.scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.envMap = this.environmentMap.texture;
          child.material.envMapIntensity = this.environmentMap.intensity;
          child.material.needsUpdate = true;
        }
      });
    };
    this.environmentMap.updateMaterials();

    if (this.debug.active && this.debugFolder) {
      this.debugFolder
        .add(this.environmentMap, 'intensity')
        .name('envMap Intensity')
        .min(0)
        .max(4)
        .step(0.001)
        .onChange(this.environmentMap.updateMaterials);
    }
  }
}
