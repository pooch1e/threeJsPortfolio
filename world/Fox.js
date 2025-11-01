import { AnimationMixer } from 'three';
export class Fox {
  constructor(worldView) {
    this.worldView = worldView;
    this.world = this.worldView.world;
    this.scene = worldView.scene;
    this.resources = worldView.resources;

    // Setup
    this.resource = this.worldView.resources.items.foxModel;
    this.time = this.world.time;

    this.setModel();
    this.setAnimation();
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
    this.animation.action = this.animationMixer.clipAction(
      this.resource.animations[0]
    );
    this.animation.action.play();
  }

  update() {
    if (this.animationMixer) {
      this.animationMixer.update(this.time.deltaTime * 0.001);
    }
  }
}
