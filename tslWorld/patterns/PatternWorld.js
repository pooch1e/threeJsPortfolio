import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu';
export class PatternWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;
    console.log(this.scene)

    // this.scene.add(this.setMesh())
    
  }

  setMesh() {
    this.geometry = new THREE.TorusKnotGeometry(0.5, 0.24, 128, 32);
    this.material = new MeshStandardNodeMaterial();

    return new THREE.Mesh(this.geometry, this.material);
  }

  update() {
    
  }

  destroy() {}
}