import FlowerField from "./Flower";
export class World {
  constructor(flowerExperience) {
    this.flowerExperience = flowerExperience;
    this.scene = this.flowerExperience.scene;
    this.resources = this.flowerExperience.resources;

    this.flower = new FlowerField(this);
  }

  update(time) {
    if (this.flower) {
      this.flower.update(time);
    }
  }

  destroy() {
    // Destroy flower instance
    if (this.flower) {
      this.flower.destroy();
    }
  }
}
