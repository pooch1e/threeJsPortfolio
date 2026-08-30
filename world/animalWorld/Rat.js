/**
 * Rat — GLTF rat model with its diffuse/normal/ARM texture set applied.
 */
import { SRGBColorSpace } from 'three';
export class Rat {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;

    this.resource = this.resources.items.ratModel;

    this.setModel();
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(50, 50, 50);

    const ratDiff = this.resources.items.ratDiffTexture;
    const ratNormal = this.resources.items.ratNormalTexture;
    const ratARM = this.resources.items.ratARMTexture;

    ratDiff.colorSpace = SRGBColorSpace;

    ratDiff.flipY = false;
    ratNormal.flipY = false;
    ratARM.flipY = false;

    this.model.traverse((child) => {
      if (child.isMesh) {
        if (!child.geometry.attributes.uv2) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }

        child.material.map = ratDiff;
        child.material.normalMap = ratNormal;
        child.material.roughnessMap = ratARM;
        child.material.aoMap = ratARM;
        child.material.metalnessMap = ratARM;

        child.material.aoMapIntensity = 1;
        child.material.roughness = 1; // Let roughnessMap control it
        child.material.metalness = 1; // Let metalnessMap control it

        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(this.model);
  }
}
