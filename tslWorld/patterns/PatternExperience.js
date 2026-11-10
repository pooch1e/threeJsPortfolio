import { TslBaseExperience } from "../TslBaseExperience";
import { PatternWorld } from "./PatternWorld";

export class PatternExperience extends TslBaseExperience {
  createWorld() {
    return new PatternWorld(this);
  }
}
