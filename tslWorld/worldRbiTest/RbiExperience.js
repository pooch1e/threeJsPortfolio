/**
 * RbiExperience — WebGPU experience for the RBI / Ryoji Ikeda test with an
 * A/B switch in the Inspector: A is the RbiWorld sketch (orbit camera), B is
 * RbiFinalWorld (fixed camera). Switching tears down the current world, its
 * scene objects and its Inspector parameter groups, then builds the other.
 */
import { sources } from "../../world/sources/sources";
import { TslBaseExperience } from "../TslBaseExperience";
import { Resources } from "../../world/utils/Resources";
import { RbiWorld } from "./RbiWorld";
import { RbiFinalWorld } from "./RbiFinalWorld";

const VARIANTS = {
  A: {
    World: RbiWorld,
    cameraPosition: [0, 0, 30],
    cameraTarget: [0, 0, 0],
    orbit: true,
  },
  B: {
    World: RbiFinalWorld,
    cameraPosition: [0, 0, 30],
    cameraTarget: [0, 0, 0],
    orbit: false,
  },
};

export class RbiExperience extends TslBaseExperience {
  setupCamera() {
    this.camera.perspectiveCamera.position.set(0, 0, 30)
  }

  createResources() {
    return new Resources(sources)
  }

  createWorld() {
    const variant = VARIANTS[this.abState.variant];
    this.applyCamera(variant);
    return this.trackParameterGroups(() => new variant.World(this));
  }

  initWorld() {
    this.abState = { variant: 'B' };
    this.setAbSwitch();

    if (this.resources.isReady) {
      this.world = this.createWorld()
      return
    }
    this.resources.on('ready', () => {
      this.world = this.createWorld()
    })
  }

  setAbSwitch() {
    const params = this.renderer.renderer.inspector.createParameters('A / B');
    params.add(this.abState, 'variant', ['A', 'B']).onChange(() => this.switchWorld());
  }

  applyCamera({ cameraPosition, cameraTarget, orbit }) {
    const camera = this.camera.perspectiveCamera;
    camera.position.set(...cameraPosition);
    this.camera.controls.target.set(...cameraTarget);
    this.camera.controls.enabled = orbit;
    camera.lookAt(this.camera.controls.target);
  }

  /**
   * Worlds create their own Inspector groups and the Inspector has no API to
   * remove one, so record the groups created during construction to detach
   * their DOM on switch.
   */
  trackParameterGroups(build) {
    const inspector = this.renderer.renderer.inspector;
    const createParameters = inspector.createParameters;
    const groups = [];
    inspector.createParameters = (name) => {
      const group = createParameters.call(inspector, name);
      groups.push(group);
      return group;
    };
    try {
      return build();
    } finally {
      inspector.createParameters = createParameters;
      this.worldParameterGroups = groups;
    }
  }

  switchWorld() {
    if (!this.world) return;

    this.world.destroy?.();
    this.world = null;
    this.worldParameterGroups?.forEach((group) => group.paramList.domElement.remove());
    this.clearScene();

    this.world = this.createWorld();
  }

  /**
   * Unlike disposeScene, this leaves textures alone: they belong to the shared
   * Resources and must survive being re-used by the next world.
   */
  clearScene() {
    this.scene.traverse((child) => {
      child.geometry?.dispose();
      const materials = [child.material].flat().filter(Boolean);
      materials.forEach((material) => material.dispose());
    });
    this.scene.clear();
    this.scene.background = null;
  }
}
