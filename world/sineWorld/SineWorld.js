/**
 * Composition root for the Sine scene. Owns the SinePoints object that
 * renders a point cloud along an animated sine wave.
 */
import SinePoints from './SineWave';
export default class SineWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.sine = new SinePoints(experience);
  }

  update(time) {
    if (this.sine) {
      this.sine.update(time);
    }
  }

  destroy() {
    if (this.sine) {
      this.sine.destroy();
    }
  }
}
