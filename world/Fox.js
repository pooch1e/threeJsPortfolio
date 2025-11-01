import { AnimationMixer } from 'three';
export class Fox {
  constructor(worldView) {
    this.worldView = worldView;
    this.world = this.worldView.world;
    this.scene = worldView.scene;
    this.resources = worldView.resources;

    // DEBUG
    this.debug = this.world.debug;

    if (this.debug.active) {
      if (this.debugFolder) {
        this.debugFolder.destroy()
      }
      this.debugFolder = this.debug.ui.addFolder('fox');
    }

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
    this.animation.play = (name) => {
      const newAction = this.animation.actions[name];
      const oldAction = this.animation.actions.current;

      newAction.reset();
      newAction.play();
      newAction.crossFadeFrom(oldAction, 1);

      this.animation.actions.current = newAction;
    };

    this.animationMixer = new AnimationMixer(this.model);

    this.animation.actions = {};

    this.animation.actions.idle = this.animationMixer.clipAction(
      this.resource.animations[0]
    );
    this.animation.actions.walking = this.animationMixer.clipAction(
      this.resource.animations[1]
    );
    this.animation.actions.running = this.animationMixer.clipAction(
      this.resource.animations[2]
    );

    this.animation.actions.current = this.animation.actions.idle;
    this.animation.actions.current.play();

    // DEBUG
    if (this.debug.active) {
      const debugObject = {
        playIdle: () => {
          this.animation.play('idle');
        },
        playWalking: () => {
          this.animation.play('walking');
        },
        playRunning: () => {
          this.animation.play('running');
        },
      };

      this.debugFolder.add(debugObject, 'playIdle');
      this.debugFolder.add(debugObject, 'playWalking');
      this.debugFolder.add(debugObject, 'playRunning');
    }
  }

  update() {
    if (this.animationMixer) {
      this.animationMixer.update(this.time.deltaTime * 0.001);
    }
  }
}
