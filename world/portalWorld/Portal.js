import * as THREE from 'three'
export class Portal {
  constructor(world) {
    this.world = world;

    this.scene = world.scene
    this.debug = world.portalExperience.debug
    this.resources = world.resources;



    this.portalModel = this.resources.items.portalModel
    console.log(this.portalModel)
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
    this.scene.add(this.portalModel.scene)
  }

  update(time) {
    if (time) {
    }
  }
}