import { sources } from "../../world/sources/sources";
import { TslBaseExperience } from "../TslBaseExperience";
import { PatternWorld } from "./PatternWorld";
import { Resources } from "../../world/utils/Resources";

export class PatternExperience extends TslBaseExperience {
  createResources() {
    return new Resources(sources.filter((s) => s.name === 'floorColorTexture'))
  }
  createWorld() {
    return new PatternWorld(this);
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
