import FlowerField from "./Flower";
import FlowerDataScroll from "./FlowerDataScroll";

export class World {
  constructor(flowerExperience) {
    this.flowerExperience = flowerExperience;
    this.scene = this.flowerExperience.scene;
    this.resources = this.flowerExperience.resources;

    this.flower = new FlowerField(this);
    this.dataScroll = new FlowerDataScroll(this, this.flower);
  }

  update(time) {
    if (this.flower) {
      this.flower.update(time);
    }
    if (this.dataScroll) {
      this.dataScroll.update();
    }
  }

  destroy() {
    if (this.flower) {
      this.flower.destroy();
    }
    if (this.dataScroll) {
      this.dataScroll.destroy();
    }
  }
}
