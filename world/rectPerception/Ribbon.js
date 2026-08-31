/**
 * Ribbon — vertical column of variable-height planes that scrolls upward,
 * with the pattern tiled above and below itself so it never shows a seam.
 */
import { MeshBasicMaterial, Mesh, PlaneGeometry, Group, Color } from "three";
import { randomFloat } from "../../utils/helpers";
import { computeTileOffsets } from "./utils/rectWorldHelpers";

// generous span over the camera's visible height at its distance from the
// scene, so short/dense patterns get tiled enough times to still fill it
const TILE_COVERAGE = 80;

export class Ribbon {
  constructor({ experience, ribbonParams }) {
    this.scene = experience.scene;

    this.ribbonParamsDebug = { ...ribbonParams };

    this.ribbonGroup = new Group();
    this.baseY = -10;

    this.baseColour = ribbonParams.colour ?? new Color("black");
    this.material = new MeshBasicMaterial({
      wireframe: false,
      color: this.baseColour,
    });

    this.ribbonGroup.position.x = this.ribbonParamsDebug.ribbonXPos;

    const { speedMin = 0.5, speedMax = 3 } = this.ribbonParamsDebug;
    this.speed = ribbonParams.speed ?? randomFloat(speedMin, speedMax);
    this.phase = Math.random();
    this.scrollY = undefined;

    this.setPlanes();

    this.scene.add(this.ribbonGroup);
    // start lower than camera
    this.ribbonGroup.position.y = this.baseY;
  }

  setPlanes() {
    // each ribbon is made up of planes with same width, variable heights,
    // stacked straight up on y with a y-gap between them
    const {
      ribbonWidth,
      planeCount,
      yGapScale,
      heightMin = 1,
      heightMax = 10,
    } = this.ribbonParamsDebug;

    while (this.ribbonGroup.children.length > 0) {
      const mesh = this.ribbonGroup.children.pop();
      this.ribbonGroup.remove(mesh);
      mesh.geometry.dispose();
    }

    const planeDefs = [];
    let yOffset = 0;

    for (let i = 1; i <= planeCount; i++) {
      const height = randomFloat(heightMin, heightMax);
      planeDefs.push({ height, y: yOffset });
      yOffset += height + yGapScale;
    }

    this.patternHeight = yOffset;

    this.scrollY =
      this.scrollY === undefined
        ? this.phase * this.patternHeight
        : this.scrollY % this.patternHeight;

    // tile the pattern above/below itself so the ribbon can scroll infinitely
    // and stays wide enough to fill the camera's view

    const tileOffsets = computeTileOffsets(this.patternHeight, TILE_COVERAGE);

    tileOffsets.forEach((tileIndex) => {
      planeDefs.forEach(({ height, y }) => {
        const planeGeometry = new PlaneGeometry(ribbonWidth, height);

        // translate origin of geometry to base as it is in middle on instatiation
        planeGeometry.translate(0, height / 2, 0);

        const mesh = new Mesh(planeGeometry, this.material);
        mesh.position.y = y + tileIndex * this.patternHeight;
        this.ribbonGroup.add(mesh);
      });
    });
  }

  updateParams(newParams) {
    Object.assign(this.ribbonParamsDebug, newParams);
    this.setPlanes();
  }

  setXPosition(x) {
    this.ribbonParamsDebug.ribbonXPos = x;
    this.ribbonGroup.position.x = x;
  }

  setSpeedRange(speedMin, speedMax) {
    this.speed = randomFloat(speedMin, speedMax);
  }
  
  setColour(color) {
    this.material.color.set(color);
  }

  destroy() {
    this.scene.remove(this.ribbonGroup);
    this.ribbonGroup.children.forEach((mesh) => mesh.geometry.dispose());
    this.material.dispose();
  }

  update(time, speedMultiplier = 1) {
    if (!time || !this.patternHeight) return;

    this.scrollY += this.speed * speedMultiplier * (time.deltaTime * 0.005);

    //wrap tiles
    this.scrollY %= this.patternHeight;

    this.ribbonGroup.position.y = this.baseY + this.scrollY;
  }
}
