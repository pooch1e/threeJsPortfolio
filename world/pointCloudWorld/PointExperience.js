/**
 * Entry point for the Point Cloud scene. Opts into audio so the cloud can read
 * its height from the spectrum and rewire its connections on the beat.
 */
import { BaseExperience } from "../BaseExperience.js";
import { World } from "./World.js";

export class PointExperience extends BaseExperience {
  createWorld() {
    return new World(this);
  }

  audioOptions() {
    return {
      path: "/static/audio/Counterpoint.m4a",
      volume: 0.4,
      smoothing: 0.25,
      triggers: {
        beat: {
          band: [2000, 8000],
          threshold: 0.35,
          holdMs: 120,
          eq: [{ band: [2000, 3000], gain: 0.6 }],
        },
      },
    };
  }
}
