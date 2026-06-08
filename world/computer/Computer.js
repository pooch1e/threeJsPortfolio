export class Computer {
  constructor(resources) {
    // load gltf
    this.sources = resources;

    this.resources.on("ready", () => {
      this.computerModel = this.sources.items.computerModel;
    });
  }
}
