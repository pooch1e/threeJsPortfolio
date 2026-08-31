/**
 * Ribbon — vertical column of variable-height planes that scrolls upward,
 * with the pattern tiled above and below itself so it never shows a seam.
 */
import { MeshBasicMaterial, Mesh, PlaneGeometry, Group, Color } from "three";
import { randomFloat } from "../../utils/helpers";
import {
  buildPlaneStack,
  buildTiledPlanes,
  advanceScrollPhase,
} from "./utils/rectWorldHelpers";

// generous span over the camera's visible height at its distance from the
// scene, so short/dense patterns get tiled enough times to still fill it
const TILE_COVERAGE = 80;

export class Ribbon {
  constructor({ experience, ribbonParams }) {
    this.scene = experience.scene;
    this.ribbonParams = { ...ribbonParams };

    this.baseY = -10;
    this.baseColour = ribbonParams.colour ?? new Color("black");
    this.material = new MeshBasicMaterial({
      wireframe: false,
      color: this.baseColour,
    });

    const { speedMin = 0.5, speedMax = 3 } = this.ribbonParams;
    this.speed = ribbonParams.speed ?? randomFloat(speedMin, speedMax);
    this.scrollPhase = Math.random();

    this.ribbonGroup = new Group();
    this.ribbonGroup.position.set(this.ribbonParams.ribbonXPos, this.baseY, 0);

    this.setPlanes();
    this.scene.add(this.ribbonGroup);
  }

  setPlanes() {
    const {
      ribbonWidth,
      planeCount,
      yGapScale,
      heightMin = 1,
      heightMax = 10,
    } = this.ribbonParams;

    this.disposeMeshes();

    const { planeDefs, patternHeight } = buildPlaneStack(
      planeCount,
      heightMin,
      heightMax,
      yGapScale,
    );
    this.patternHeight = patternHeight;

    buildTiledPlanes(planeDefs, patternHeight, TILE_COVERAGE).forEach(
      ({ height, y }) => {
        const planeGeometry = new PlaneGeometry(ribbonWidth, height);

        // geometry is centred on instantiation, so shift its origin to the base
        planeGeometry.translate(0, height / 2, 0);

        const mesh = new Mesh(planeGeometry, this.material);
        mesh.position.y = y;
        this.ribbonGroup.add(mesh);
      },
    );
  }

  disposeMeshes() {
    while (this.ribbonGroup.children.length > 0) {
      const mesh = this.ribbonGroup.children[0];
      this.ribbonGroup.remove(mesh);
      mesh.geometry.dispose();
    }
  }

  updateParams(newParams) {
    Object.assign(this.ribbonParams, newParams);
    this.setPlanes();
  }

  setXPosition(x) {
    this.ribbonParams.ribbonXPos = x;
    this.ribbonGroup.position.x = x;
  }

  setSpeedRange(speedMin, speedMax) {
    this.speed = randomFloat(speedMin, speedMax);
  }

  setColour(color) {
    this.material.color.set(color);
  }

  update(time, speedMultiplier = 1) {
    if (!time || !this.patternHeight) return;

    this.scrollPhase = advanceScrollPhase(
      this.scrollPhase,
      this.speed,
      speedMultiplier,
      time.deltaTime,
      this.patternHeight,
    );

    this.ribbonGroup.position.y =
      this.baseY + this.scrollPhase * this.patternHeight;
  }

  destroy() {
    this.scene.remove(this.ribbonGroup);
    this.disposeMeshes();
    this.material.dispose();
  }
}
