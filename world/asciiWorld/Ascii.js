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
    this.buildGlyphAtlas();
    this.buildCellDataTexture();

    // assign data texture to materials
    this.planeMaterial.uniforms.uCellData.value = this.cellDataTexture;
    this.planeMaterial.uniforms.uGlyphAtlas.value = this.glyphAtlasTexture;
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
        uResolution: {
          value: new THREE.Vector2(this.sizes.width, this.sizes.height),
        },
        uMouseCell: { value: new THREE.Vector2(-1, -1) },
        uCellData: { value: null },
        uGlyphAtlas: { value: null },
        uGridCount: { value: this.gridCount },
        uNumChars: { value: 9 }, // chars.length
        uAspect: { value: this.sizes.width / this.sizes.height },
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
      })),
    );
  }

  buildGlyphAtlas() {
    const chars = "@#%+=-:. ";
    this.chars = chars;
    const glyphSize = 32; // pixels

    // build atlas map in canvas - surely a better way to do this
    const canvas = document.createElement("canvas");
    canvas.width = chars.length * glyphSize;
    canvas.height = glyphSize;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = `${glyphSize * 0.8}px monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], i * glyphSize + glyphSize / 2, glyphSize / 2);
    }

    this.glyphAtlasTexture = new THREE.CanvasTexture(canvas);
    this.glyphAtlasTexture.minFilter = THREE.LinearFilter;
    this.glyphAtlasTexture.magFilter = THREE.LinearFilter;
  }

  buildCellDataTexture() {
    const total = this.cols * this.rows;
    this.cellData = new Uint8Array(total * 4);
    this.cellDataTexture = new THREE.DataTexture(
      this.cellData,
      this.cols,
      this.rows,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );
    this.cellDataTexture.minFilter = THREE.NearestFilter;
    this.cellDataTexture.magFilter = THREE.NearestFilter;
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

  updateCellDataTexture() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const cell = this.cellStates[x][y];
        const idx = (y * this.cols + x) * 4;

        // Choose a char index based on hover state (or later: brightness)
        let charIndex = 8;
        if (cell.hovered) charIndex = 0; // '@'
        if (cell.neighbour) charIndex = 3; // '+'

        this.cellData[idx + 0] = charIndex; // R
        this.cellData[idx + 1] = cell.hovered ? 255 : 128; // G = brightness
      }
    }
    this.cellDataTexture.needsUpdate = true;
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
      this.planeMaterial.uniforms.uResolution.value.set(
        this.sizes.width,
        this.sizes.height,
      );
      // Rebuild cell states since column count changes with aspect ratio
      this.buildCellStates();
    });
  }

  update(time) {
    if (time) {
      this.updateCellDataTexture();
    }
  }

  destroy() {}
}
