export default class SineWorld {
  constructor(sineExperience) {
    this.sineExperience = sineExperience;
    this.scene = this.sineExperience.scene;
    this.debug = this.sineExperience.debug;
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {
    if (this.sine) {
      this.sine.destroy();
    }
  }
}
