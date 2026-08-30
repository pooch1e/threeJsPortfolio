/**
 * Composition root for the ASCII scene. Owns the single Ascii object that
 * renders the mouse-reactive character grid.
 */
import { Ascii } from "./Ascii";
export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.ascii = new Ascii(experience);
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
