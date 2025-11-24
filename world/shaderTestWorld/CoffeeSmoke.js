export default class CoffeeSmoke {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    // setup
    this.resource = this.resources.items.coffeeSmokeModel;
    this.setModel();
    this.setDebug();
  }

  setModel() {
    this.model = this.resource.scene;

    const bakedMesh = this.model.getObjectByName('baked');
    if (bakedMesh && bakedMesh.material && bakedMesh.material.map) {
      bakedMesh.material.map.anisotropy = 8;
    }

    this.scene.add(this.model);
  }

  setDebug() {}

  update(time) {
    if (time) {
      
    }
  }
}
