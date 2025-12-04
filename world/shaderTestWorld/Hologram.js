import * as THREE from 'three';
export default class Hologram {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;
    console.log(this.resources, 'resources');

    // Setup
    this.material = new THREE.ShaderMaterial();
    this.resource = this.resources.items.suzanneModel;

    this.setModels();
    this.setDebug();
  }

  setModels() {
    this.setSphere();
    this.setSuzanne();
    this.setTorus();
  }

  setSphere() {
    this.sphereGeometry = new THREE.SphereGeometry(1);

    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.material);
    this.sphereMesh.position.x = 1;
    this.scene.add(this.sphereMesh);
  }

  setSuzanne() {
    this.suzanneModel = this.resource.scene;
    this.suzanneModel.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });

    this.suzanneModel.position.y = 2;

    this.scene.add(this.suzanneModel);
  }

  setTorus() {
    this.torusGeometry = new THREE.TorusKnotGeometry(1);
    this.torusMesh = new THREE.Mesh(this.torusGeometry, this.material);
    this.torusMesh.position.x = -2;

    this.scene.add(this.torusMesh);
  }

  setDebug() {}
  update(time) {
    if (time && this.material) {
      // Sphere
      this.sphereMesh.rotation.x = time.elapsedTime * 0.002;
      this.sphereMesh.rotation.y = time.elapsedTime * 0.001;

      // Suzanne
      this.suzanneModel.rotation.x = time.elapsedTime * 0.002;
      this.suzanneModel.rotation.y = time.elapsedTime * 0.001;

      // Torus
      this.torusMesh.rotation.x = time.elapsedTime * 0.002;
      this.torusMesh.rotation.y = time.elapsedTime * 0.001;
    }
  }
  destroy() {}
}
