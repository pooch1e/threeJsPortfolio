import * as THREE from 'three';
export class Rat {
  constructor(worldView) {
    this.world = worldView;
    this.scene = worldView.scene;
    this.resources = worldView.resources;

    // Setup
    this.resource = this.world.resources.items.ratModel;

    this.setModel();
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(50, 50, 50);

    //add shadows to model
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material.map = this.resources.items.ratDiffTexture;
        child.material.normalMap = this.resources.items.ratNormalTexture;
        child.material.roughnessMap = this.resources.items.ratARMTexture;
        child.material.aoMap = this.resources.items.ratARMTexture;
        child.material.aoMapIntensity = 1;
        child.material.metalnessMap = this.resources.items.ratARMTexture;

        child.material.needsUpdate = true;
        child.castShadow = true;
      }
    });

    // model is loaded
    this.scene.add(this.model);
  }
}
