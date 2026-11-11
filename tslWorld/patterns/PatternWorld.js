import * as THREE from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { WorldTransform } from '../../world/utils/WorldTransform';
import { vec4, normalLocal } from 'three/tsl';
export class PatternWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene = this.experience.scene;
    this.resources = experience.resources;
    this.transformControls = new WorldTransform({ canvas: experience.canvas, camera: experience.camera.perspectiveCamera, orbitControls: experience.camera.controls, scene: this.scene })
    

    this.setMesh();
    this.setLight()
    this.setFloor()
    
  }

  setMesh() {
    this.geometry = new THREE.TorusKnotGeometry(0.5, 0.24, 128, 32);
    this.material = new MeshStandardNodeMaterial();
    this.material.outputNode = vec4(normalLocal, 1)
    

    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = 2;
    this.transformControls.attach(this.mesh)
    this.scene.add(this.transformControls.helper)
    this.scene.add(this.mesh)
  }

  setLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(2, 0.75, -1).normalize().multiplyScalar(10);
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.near = 0.01;
    this.directionalLight.shadow.camera.far = 20;
    this.directionalLight.shadow.camera.radius = 3;
    this.directionalLight.shadow.normalBias = 0.1;
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(0x859dff, 1)
    this.scene.add(this.ambientLight);
  }

  setFloor() {
    this.floor = this.resources.items.floorColorTexture;
    const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    const material = new MeshStandardNodeMaterial({ map: this.floor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = - Math.PI * 0.5;
    mesh.receiveShadow = true;
    this.scene.add(mesh)
  }


  update() {
    
  }

  destroy() {
    if (this.transformControls) {
      this.transformControls.dispos()
    }
  }
}