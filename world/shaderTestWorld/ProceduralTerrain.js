import * as THREE from 'three';
export default class ProceduralTerrain {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources;
    this.environmentMap = this.resources.items.spruitSunset;
    this.baseMeshModel = this.resources.items.cubeBaseTest.scene;

    //setup
    this.setBackground();
    // this.addPlaceholder();
    this.addBaseMesh();
    this.addLights();
  }

  setBackground() {
    if (this.environmentMap) {
      this.environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = this.environmentMap;
      this.scene.backgroundBlurriness = 0.5;
      this.scene.environment = this.environmentMap;
    }
  }

  addBaseMesh() {
    this.scene.add(this.baseMeshModel);
  }

  addPlaceholder() {
    this.placeholder = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 5),
      new THREE.MeshPhysicalMaterial(),
    );
    this.scene.add(this.placeholder);
  }

  addLights() {
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 2);
    this.directionalLight.position.set(6.25, 3, 4);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 30;
    this.directionalLight.shadow.camera.top = 8;
    this.directionalLight.shadow.camera.right = 8;
    this.directionalLight.shadow.camera.bottom = -8;
    this.directionalLight.shadow.camera.left = -8;
    this.scene.add(this.directionalLight);
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {
    // destroy something

    // Lights
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight.dispose();
    }

    // Debug folder
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
