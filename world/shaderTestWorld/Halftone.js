export default class Halftone {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;
    this.resource = this.resources.items.suzanneModel;

    this.setModels();
    this.setDebug();
  }

  setModels() {
    this.suzanneModel = this.resource.scene;
    this.suzanneModel.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });

    this.scene.add(this.suzanneModel);
  }

  update(time) {
    if (time && this.suzanneModel) {
      // Suzanne
      this.suzanneModel.rotation.x = time.elapsedTime * 0.002;
      this.suzanneModel.rotation.y = time.elapsedTime * 0.001;
    }
  }

  destroy() {
    // Model
    if (this.suzanneModel) {
      this.scene.remove(this.suzanneModel);
      this.suzanneModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();

          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            if (child.material.normalMap) child.material.normalMap.dispose();
            child.material.dispose();
          }
        }
      });
    }
  }
}
