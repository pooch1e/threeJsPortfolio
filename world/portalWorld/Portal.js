import * as THREE from 'three'
export class Portal {
  constructor(world) {
    this.world = world;
    this.resources = world.resources;
    this.scene = world.scene
    this.debug = world.portalExperience.debug
    this.portalModel = this.resources.items.portalModel
    this.portalMap = this.resources.items.portalMap

    console.log(this.portalMap, this.portalModel, 'grabbing models')
    //methods here

  }
}