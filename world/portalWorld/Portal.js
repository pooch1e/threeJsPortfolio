import * as THREE from 'three'
export class Portal {
  constructor(world) {
    this.world = world;

    this.scene = world.scene
    this.debug = this.world.portalExperience.debug
    this.resources = world.resources;
    this.environment = this.world.environment



    this.portalModel = this.resources.items.portalModel
    this.portalMap = this.resources.items.portalMap


    this.addLights()
    this.setModel()
  }



  addLights() {
    this.pointLight = new THREE.PointLight('white', 100)
    this.pointLight.position.y = 10
    this.scene.add(this.pointLight)
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
    this.scene.add(this.portalModel.scene);

  }

  update(time) {
    if (time) {
    }
  }
}