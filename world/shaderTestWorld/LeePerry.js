export default class LeePerry {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources.items.leePerryModel;

    // setup
    this.setMaterials();
    this.setMesh();
  }
}
