import * as THREE from "three";
export class Portal {
  constructor(world) {
    this.world = world;

    this.scene = world.scene;
    this.debug = this.world.portalExperience.debug;
    this.resources = world.resources;
    this.environment = this.world.environment;
    this.debug = this.world.portalExperience.debug;
    this.renderer = this.world.portalExperience.renderer.renderer;
    console.log(this.renderer);

    this.portalModel = this.resources.items.portalModel;
    this.portalMap = this.resources.items.portalMap;

    this.debugObject = {
      clearColor: "#43351e",
      fireflyCount: 30,
      fireflySize: 0.1,
    };

    this.renderer.setClearColor(this.debugObject.clearColor);

    this.addLights();
    this.setModel();
    this.setFlies();
    this.setDebug();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Portal Blend");
      this.debugFolder.addColor(this.debugObject, "clearColor").onChange(() => {
        this.renderer.setClearColor(this.debugObject.clearColor);
      });
    }
  }

  addLights() {
    this.pointLight = new THREE.RectAreaLight("white", 5);
    this.pointLight.position.y = 10;
    this.pointLight.lookAt(0, 0, 0);
    this.scene.add(this.pointLight);
  }

  setModel() {
    // this.portalModel.scene.traverse((child) => {
    //   if (child.isMesh) {
    //     child.material = new THREE.MeshBasicMaterial({
    //       map: this.portalMap
    //     });
    //   }
    // });
    // texture looks SHIT - use built in for now
    this.portalModel.scene.rotation.y = -90;
    this.scene.add(this.portalModel.scene);
  }

  setFlies() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.debugObject.fireflyCount * 3)
    for (let i = 0; i < this.debugObject.fireflyCount; i++) {
      positions[i * 3] = Math.random() * 2
      positions[i * 3 + 1] = Math.random() * 2
      positions[i * 3 + 2] = Math.random() * 2
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    this.firefliesMaterial = new THREE.PointsMaterial({ size: 0.1, sizeAttenuation: true })
    this.fireflyPoints = new THREE.Points(this.geometry, this.firefliesMaterial)
    this.scene.add(this.fireflyPoints)
  }

  update(time) {
    if (time) {
    }
  }
}
