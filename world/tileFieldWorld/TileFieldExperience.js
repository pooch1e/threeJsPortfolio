/**
 * TileFieldExperience — entry point for the Tile Field scene. A fixed
 * orthographic camera framing a grid of noise-gated sprites that reorganise
 * around the cursor. After the original by Studio OBV for the Center for
 * Planetary Pedagogies; see README.md.
 */
import { NoToneMapping } from "three";
import { BaseExperience } from "../BaseExperience";
import { World } from "./World";
import { Resources } from "../utils/Resources";
import { sources } from "../sources/sources";
import { Mouse } from "../utils/Mouse";
import { SPRITE_SOURCE } from "./tileFieldConfig";

export class TileFieldExperience extends BaseExperience {
  constructor(canvas, options) {
    super(canvas, options);

    // The renderer's Cineon curve at 1.75 exposure lifts and desaturates flat
    // sprite colour; this scene is a 2D blit and wants its palette untouched
    this.renderer.renderer.toneMapping = NoToneMapping;
  }

  createResources() {
    return new Resources(
      sources.filter((source) => source.name === SPRITE_SOURCE),
    );
  }

  createWorld() {
    return new World(this);
  }

  cameraOptions() {
    return { controls: false, type: "orthographic" };
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
  }
}
