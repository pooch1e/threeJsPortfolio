export default class CoffeeSmoke {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scenel;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    // setup
    this.resource = this.resources.items.coffeeSmokeModel;
    this.setModel();
    this.setDebug();
  }

  setModel() {
    this.model = this.resource.scene;
    this.material = this.model.material;
    
    
  }

  setDebug() {

  }
}
