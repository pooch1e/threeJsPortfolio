export class Ascii {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.asciiExperience.debug;
    console.log(this.world)

    // this.setDebug();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Ascii Experience");
    }
  }
  update(time) {
    if (time) {
      
    }
  }

  destroy() {}
}
