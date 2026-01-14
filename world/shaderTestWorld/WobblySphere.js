import * as THREE from 'three';
export default class WobblySphere {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.environment = this.world.environment;
    this.resources = this.world.resources;
    this.debug = this.world.shaderExperience.debug;
    this.environmentMap = this.resources.items.urbanStreet;
    // setup
    this.setLights();
    this.setBackground();
    this.setModels();
    this.setDebugPlane();
    this.setDebug();
  }

  setLights() {
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 3);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.far = 15;
    this.directionalLight.shadow.normalBias = 0.05;
    this.directionalLight.position.set(0.25, 2, -2.25);
    this.scene.add(this.directionalLight);
  }

  setBackground() {
    if (this.environmentMap && this.environmentMap) {
      this.environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = this.environmentMap;
      this.scene.environment = this.environmentMap;
    }
  }

  setModels() {
    this.material = new THREE.MeshPhysicalMaterial({
      metalness: 0,
      roughness: 0.5,
      color: '#ffffff',
      transmission: 0,
      ior: 1.5,
      thickness: 1.5,
      transparent: true,
      wireframe: false,
    });

    this.geometry = new THREE.IcosahedronGeometry(2.5, 50);

    this.WobbleMesh = new THREE.Mesh(this.geometry, this.material);
    this.WobbleMesh.receiveShadow = true;
    this.WobbleMesh.castShadow = true;
    this.scene.add(this.WobbleMesh);
  }

  setDebugPlane() {
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15, 15),
      new THREE.MeshStandardMaterial()
    );
    this.plane.receiveShadow = true;
    this.plane.rotation.y = Math.PI;
    this.plane.position.y = -5;
    this.plane.position.z = 5;
    this.scene.add(this.plane);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Wobbly Sphere');

      this.debugFolder.add(this.material, 'metalness', 0, 1, 0.001);
      this.debugFolder.add(this.material, 'roughness', 0, 1, 0.001);
      this.debugFolder.add(this.material, 'transmission', 0, 1, 0.001);
      this.debugFolder.add(this.material, 'ior', 0, 10, 0.001);
      this.debugFolder.add(this.material, 'thickness', 0, 10, 0.001);
      this.debugFolder.addColor(this.material, 'color');
    }
  }

  update(time) {
    if (time) {
      // animate something
    }
  }
  destroy() {
    // destroy something
  }
}
