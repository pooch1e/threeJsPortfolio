export default class LeePerry {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources;

    // setup
    this.resource = this.resources.items.leePerryModel;
    this.setModel();
    this.setMaterial();
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(0.2, 0.2, 0.2);
    this.scene.add(this.model);

    if (this.environment && this.environment.environmentMap) {
      this.environment.environmentMap.updateMaterials();
    }
  }

  setMaterial() {
    
  }

  update(time) {
    // console.log('updating');
  }
}
