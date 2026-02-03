import SinePoints from './SineWave';
export default class SineWorld {
  constructor(sineExperience) {
    this.sineExperience = sineExperience;
    this.scene = this.sineExperience.scene;
    this.debug = this.sineExperience.debug;
    this.sine = new SinePoints(this);
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
