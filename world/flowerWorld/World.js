/**
 * Composition root for the Flower scene. Owns three sub-systems and drives
 * their per-frame update()/destroy() lifecycle:
 *  - FlowerSimulation: one shared GPGPU flow-field particle simulation.
 *  - FlowerPoints (x3, positions/colors in FLOWER_PLACEMENTS below): each
 *    renders that shared simulation's particle texture at its own position
 *    with its own color palette.
 *  - FlowerTextGrid: decorative scrolling-text tiles parented to the camera,
 *    so they read as a fixed background regardless of camera orbit.
 */
import FlowerSimulation from "./FlowerSimulation";
import FlowerPoints from "./FlowerPoints";
import FlowerTextGrid from "./FlowerTextGrid";
import { Color } from "three";

const FLOWER_PLACEMENTS = [
  {
    position: { x: -2.5, y: -1, z: 1 },
    colorBase: "#2A2D33",
    colorA: "#3B5C8C",
    colorB: "#8C3B5C",
  },
  {
    position: { x: 0, y: -1, z: 1 },
    colorBase: "#332E2A",
    colorA: "#8C6B3B",
    colorB: "#8C3B4E",
  },
  {
    position: { x: 2.5, y: -1, z: 1 },
    colorBase: "#2E2A33",
    colorA: "#3B8C6B",
    colorB: "#5C3B8C",
  },
];

export class World {
  constructor(flowerExperience) {
    this.flowerExperience = flowerExperience;
    this.scene = this.flowerExperience.scene;
    this.resources = this.flowerExperience.resources;

    this.simulation = new FlowerSimulation(this);
    this.flowers = FLOWER_PLACEMENTS.map(
      (placement) => new FlowerPoints(this, this.simulation, placement),
    );
    this.textGrid = new FlowerTextGrid(this);

    this.scene.background = new Color("#C3C0C2");
  }

  update(time) {
    this.simulation.update(time);
    this.flowers.forEach((flower) => flower.update());
    this.textGrid.update();
  }

  destroy() {
    this.flowers.forEach((flower) => flower.destroy());
    this.simulation.destroy();
    this.textGrid.destroy();
  }
}
