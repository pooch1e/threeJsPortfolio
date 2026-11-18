import { sources } from "../../world/sources/sources";
import { TslBaseExperience } from "../TslBaseExperience";
import { Resources } from "../../world/utils/Resources";
import { RbiWorld } from "./RbiWorld";

export class RbiExperience extends TslBaseExperience {
  setupCamera() {
    this.camera.perspectiveCamera.position.set(0, 0, 30)
  }

  createResources() {
    return new Resources(sources)
  }
  createWorld() {
    return new RbiWorld(this);
  }

  initWorld() {
    if (this.resources.isReady) {
      this.world = this.createWorld()
      return
    }
    this.resources.on('ready', () => {
      this.world = this.createWorld()
    })
  }
}
