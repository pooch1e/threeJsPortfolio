import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export class Ascii {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.asciiExperience.debug;
    this.sizes = world.asciiExperience.sizes;
    this.mouse = world.asciiExperience.mouse;

    this.gridCount = 30; // rows — single source of truth shared with shader

    this.setDebug();
    this.setPlaneGeometry();
    this.buildCellStates();
    this.setMouseListener();
    this.setResizeListener();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Ascii Experience");
    }
  }

  setPlaneGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(10, 10, 100);
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) },
        uMouseCell: { value: new THREE.Vector2(-1, -1) },
      },
    });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.planeMesh);
  }

  // Build a 2D array [cols][rows] of cell state objects.
  // cols depends on aspect ratio; rows = gridCount.
  buildCellStates() {
    const aspect = this.sizes.width / this.sizes.height;
    this.cols = Math.round(aspect * this.gridCount);
    this.rows = this.gridCount;

    this.cellStates = Array.from({ length: this.cols }, (_, cx) =>
      Array.from({ length: this.rows }, (_, cy) => ({
        x: cx,
        y: cy,
        hovered: false,
        neighbour: false,
        // future: char, brightness, etc.
      }))
    );
  }

  setMouseListener() {
    this.mouse.on("move", () => {
      const intersects = this.mouse.getIntersects([this.planeMesh]);

      if (intersects.length === 0) {
        // Mouse left the plane — clear hover
        this.planeMaterial.uniforms.uMouseCell.value.set(-1, -1);
        this._clearHoverStates();
        return;
      }

      const uv = intersects[0].uv;
      const aspect = this.sizes.width / this.sizes.height;

      const cx = Math.floor(uv.x * aspect * this.gridCount);
      const cy = Math.floor(uv.y * this.gridCount);

      this.planeMaterial.uniforms.uMouseCell.value.set(cx, cy);
      this._updateHoverStates(cx, cy);
    });
  }

  _clearHoverStates() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.cellStates[x][y].hovered = false;
        this.cellStates[x][y].neighbour = false;
      }
    }
  }

  _updateHoverStates(cx, cy) {
    // 4-directional neighbours: N, S, E, W
    const neighbourOffsets = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.cellStates[x][y].hovered = false;
        this.cellStates[x][y].neighbour = false;
      }
    }

    // Mark hovered cell
    if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
      this.cellStates[cx][cy].hovered = true;
    }

    // Mark 4-directional neighbours
    for (const [dx, dy] of neighbourOffsets) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
        this.cellStates[nx][ny].neighbour = true;
      }
    }
  }

  setResizeListener() {
    this.sizes.on("resize", () => {
      this.planeMaterial.uniforms.uResolution.value.set(this.sizes.width, this.sizes.height);
      // Rebuild cell states since column count changes with aspect ratio
      this.buildCellStates();
    });
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {}
}
