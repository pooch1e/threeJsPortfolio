import { Ascii } from "./Ascii";
export class World {
  constructor(asciiExperience) {
    this.asciiExperience = asciiExperience;
    this.scene = this.asciiExperience.scene;
    this.debug = this.asciiExperience.debug;
    this.ascii = new Ascii(this);
  }

  update(time) {
    if (time) {
      this.ascii.update(time);
    }
  }

  destroy() {
    if (this.ascii) {
      this.ascii.destroy();
    }
  }
}
