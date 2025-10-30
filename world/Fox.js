export class Fox {
  constructor(worldView) {
    this.world = worldView;
    this.scene = worldView.scene;
    this.resources = worldView.resources;

    console.log('fox here');
    console.log(this.world, this.scene, this.resources);

    // Setup
    this.resource = this.world.resources.items.models;
    console.log(this.resource);
  }
}
