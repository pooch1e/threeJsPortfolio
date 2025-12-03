import * as THREE from 'three';
export default class Hologram {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    // Setup

    this.setModel()
    this.setDebug()
  }

  setModel(){}
  setDebug(){}
  update(time){}
  destroy(){}
  

}
