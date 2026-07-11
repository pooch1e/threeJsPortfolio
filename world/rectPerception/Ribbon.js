import { MeshBasicMaterial, Mesh, PlaneGeometry, Group, Color } from "three";
import { randomFloat } from "../../utils/helpers";

const TILE_OFFSETS = [-1, 0, 1];

export class Ribbon {
  constructor({ world, ribbonParams }) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.rectExperience.debug;
    this.time = this.world.rectExperience.time;

    // ribbon param object to control in debug
    this.ribbonParamsDebug = { ...ribbonParams };

    this.ribbonGroup = new Group();
    this.baseY = -10;

    // const material as nothing gonna change
    this.material = new MeshBasicMaterial({
      wireframe: false,
      color: ribbonParams.colour ?? new Color("black"),
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
      xWidth,
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
      // skew toward heightMin so most blocks are short with occasional
      // long spikes, instead of an even spread across the full range
      const height = randomFloat(heightMin, heightMax);
      // const height =
      //   heightMin + Math.pow(Math.random(), 3) * (heightMax - heightMin);
      planeDefs.push({ height, y: yOffset });
      yOffset += height + yGapScale;
    }

    this.patternHeight = yOffset;

    this.scrollY =
      this.scrollY === undefined
        ? this.phase * this.patternHeight
        : this.scrollY % this.patternHeight;

    // tile the pattern above/below itself so the ribbon can scroll infinitely

    TILE_OFFSETS.forEach((tileIndex) => {
      planeDefs.forEach(({ height, y }) => {
        const planeGeometry = new PlaneGeometry(xWidth, height);

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
