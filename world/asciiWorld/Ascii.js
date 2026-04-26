import { PlaneGeometry, ShaderMaterial, Vector2, Mesh, CanvasTexture, LinearFilter, DataTexture, RGBAFormat, UnsignedByteType, NearestFilter } from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export class Ascii {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.asciiExperience.debug;
    this.sizes = world.asciiExperience.sizes;
    this.mouse = world.asciiExperience.mouse;

    this.gridCount = 100;
    this.rippleRadius = 10;
    this.mouseEventName = "move.ascii";
    this.resizeEventName = "resize.ascii";

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
    this.updateCellDataTexture();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Ascii Experience");
    }
  }

  setPlaneGeometry() {
    this.planeGeometry = new PlaneGeometry(10, 10, 100);
    this.planeMaterial = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uResolution: {
          value: new Vector2(this.sizes.width, this.sizes.height),
        },
        uMouseCell: { value: new Vector2(-1, -1) },
        uCellData: { value: null },
        uGlyphAtlas: { value: null },
        uGridCount: { value: this.gridCount },
        uNumChars: { value: 9 }, // chars.length
        uAspect: { value: this.sizes.width / this.sizes.height },
      },
    });
    this.planeMesh = new Mesh(this.planeGeometry, this.planeMaterial);
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
    this.defaultCharIndex = chars.indexOf(".");
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

    this.glyphAtlasTexture = new CanvasTexture(canvas);
    this.glyphAtlasTexture.minFilter = LinearFilter;
    this.glyphAtlasTexture.magFilter = LinearFilter;
  }

  buildCellDataTexture() {
    this.cellDataTexture?.dispose();

    const total = this.cols * this.rows;
    this.cellData = new Uint8Array(total * 4);
    this.cellDataTexture = new DataTexture(
      this.cellData,
      this.cols,
      this.rows,
      RGBAFormat,
      UnsignedByteType,
    );
    this.cellDataTexture.minFilter = NearestFilter;
    this.cellDataTexture.magFilter = NearestFilter;
    this.cellDataTexture.needsUpdate = true;
  }

  setMouseListener() {
    this.mouse.on(this.mouseEventName, () => {
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
    const hoverCell = this.planeMaterial.uniforms.uMouseCell.value;
    const hasHover = hoverCell.x >= 0 && hoverCell.y >= 0;

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const cell = this.cellStates[x][y];
        const idx = (y * this.cols + x) * 4;

        let charIndex = this.defaultCharIndex;
        let brightness = 0.45;

        if (hasHover) {
          const dx = hoverCell.x - x;
          const dy = hoverCell.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= this.rippleRadius) {
            const normalizedDistance = distance / this.rippleRadius;
            const maxRippleIndex = this.defaultCharIndex;
            const rippleIndex = Math.floor(normalizedDistance * maxRippleIndex);
            charIndex = Math.min(maxRippleIndex, rippleIndex);
            brightness = 1.0 - normalizedDistance * 0.55;
          }
        }

        if (cell.hovered) {
          charIndex = 0;
          brightness = 1.0;
        }

        this.cellData[idx + 0] = charIndex; // R
        this.cellData[idx + 1] = Math.round(brightness * 255); // G = brightness
        this.cellData[idx + 2] = 0;
        this.cellData[idx + 3] = 255;
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
    this.sizes.on(this.resizeEventName, () => {
      this.planeMaterial.uniforms.uResolution.value.set(
        this.sizes.width,
        this.sizes.height,
      );
      this.planeMaterial.uniforms.uAspect.value =
        this.sizes.width / this.sizes.height;

      // Rebuild cell states since column count changes with aspect ratio
      this.buildCellStates();
      this.buildCellDataTexture();
    });
  }

  update(time) {
    this.updateCellDataTexture();
    this.planeMaterial.uniforms.uNumChars.value = time.elapsedTime * 0.002;
    if (this.planeMaterial.uniforms.uNumChars.vale > 2000) {
      this.planeMaterial.uniforms.uNumChars.value = 9;
    }
  }

  destroy() {
    this.mouse.off(this.mouseEventName);
    this.sizes.off(this.resizeEventName);

    if (this.planeMesh) {
      this.scene.remove(this.planeMesh);
    }

    this.planeGeometry?.dispose();
    this.cellDataTexture?.dispose();
    this.glyphAtlasTexture?.dispose();
    this.planeMaterial?.dispose();
    this.debugFolder?.destroy();

    this.cellStates = null;
    this.cellData = null;
    this.planeMesh = null;
    this.planeGeometry = null;
    this.planeMaterial = null;
    this.cellDataTexture = null;
    this.glyphAtlasTexture = null;
    this.debugFolder = null;
  }
}
