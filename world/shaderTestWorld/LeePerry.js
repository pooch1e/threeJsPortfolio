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
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(0.2, 0.2, 0.2);
    const leeColor = this.resources.items.leePerryColor;
    const leeNormal = this.resources.items.leePerryNormal;

    this.model.traverse((child) => {
      if (child.isMesh) {
        if (leeColor) {
          child.material.map = leeColor;
        }
        if (leeNormal) {
          child.material.normalMap = leeNormal;
        }
        child.material.needsUpdate = true;
      }
    });

    if (this.environment && this.environment.environmentMap) {
      this.environment.environmentMap.updateMaterials();
    }
    this.scene.add(this.model);
  }

  update(time) {
    // console.log('updating');
  }
}
