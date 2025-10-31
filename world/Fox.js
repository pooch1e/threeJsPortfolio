import { AnimationMixer } from 'three';
export class Fox {
  constructor(worldView) {
    this.world = worldView;
    this.scene = worldView.scene;
    this.resources = worldView.resources;

    // Setup
    this.resource = this.world.resources.items.foxModel;

    this.setModel();
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(0.02, 0.02, 0.02);
    this.model.position.x = -2.5;
    // model is loaded
    this.scene.add(this.model);
  }

  setAnimation() {
    this.animation = {};
    this.animationMixer = new AnimationMixer(this.model);
    this.animation.action = this.animation.mixer.clipAction(
      this.resource.animations[0]
    );
    this.animation.action.play();
  }
}
