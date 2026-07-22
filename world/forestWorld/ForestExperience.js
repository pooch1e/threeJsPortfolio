
import { BaseExperience } from "../BaseExperience";
import { World } from "./World";
import { Mouse } from "../utils/Mouse";
import { Resources } from "../utils/Resources";
import { sources } from "../sources/sources";

export const GRID_SIZE = 18;

export class ForestExperience extends BaseExperience {

  createWorld() {
    return new World(this)
  }

  setupUtils() {
    this.mouse = new Mouse(this.canvas, this.camera);
    this.resources = new Resources(sources)
  }

  cameraOptions() {
    return { controls: false };
  }

  setupCamera() {
    this.fitCameraToGrid();
  }

  resize() {
    super.resize();
    this.fitCameraToGrid();
  }

  fitCameraToGrid() {
    const camera = this.camera.perspectiveCamera;
    const center = (GRID_SIZE - 1) / 2;

    const halfFovY = (camera.fov * Math.PI) / 360;
    const distanceForHeight = GRID_SIZE / 2 / Math.tan(halfFovY);
    const distanceForWidth = distanceForHeight / camera.aspect;
    const distance = Math.max(distanceForHeight, distanceForWidth);

    camera.position.set(center, center, distance);
    camera.lookAt(center, center, 0);
  }
}
