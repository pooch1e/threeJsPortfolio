/**
 * Decorative background layer — a grid of small scrolling-text tiles spread
 * across the viewport. Independent of the flowers/live stats: tiles share a
 * small fixed set of pre-painted, looping textures (painted once, scrolled
 * via GPU texture offset/RepeatWrapping, not redrawn per frame) rather than
 * each tile owning its own canvas.
 *
 * The whole grid is parented to the camera (not the scene), so it moves in
 * lockstep with camera orbit/rotation and reads as a fixed background rather
 * than a world-space object you could orbit around. Three's renderer only
 * draws children of the scene graph it's given, so the camera itself is
 * added to the scene the first time this runs — otherwise objects parented
 * to it would never actually render.
 *
 * GRID_DEPTH is a camera-local distance (not a world-space one): it has to
 * exceed the camera's orbit radius from the target (~5.1 units, from
 * Camera.js's (0, 1, 5) start position) so the grid plane sits beyond the
 * flowers from any orbit angle instead of drifting in front of them. Grid
 * width/height are derived from the camera's FOV and aspect at that depth so
 * the tiles exactly fill the frustum.
 */
import {
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  CanvasTexture,
  RepeatWrapping,
  ClampToEdgeWrapping,
  LinearFilter,
  Group,
} from "three";

const TILE_SIZE_WORLD = 2.6;
const TILE_GAP = 0.6;
const GRID_DEPTH = -9;
const SOURCE_TEXTS = [
  ["flowField", "influence: 0.5", "noise: simplex4d"],
  ["particles: gpgpu", "size: 128x128", "decay: 0.3/s"],
  ["scene: FlowerScene", "children: 3", "model: gltf"],
];

export default class FlowerTextGrid {
  constructor(world) {
    this.sizes = world.flowerExperience.sizes;
    this.camera = world.flowerExperience.camera.perspectiveCamera;

    this.tiles = [];
    this.baseTextures = SOURCE_TEXTS.map((lines) => this.buildTexture(lines));

    if (!this.camera.parent) {
      world.scene.add(this.camera);
    }
    this.group = new Group();
    this.camera.add(this.group);

    this.buildGrid();

    this.sizes.on("resize.flowerTextGrid", () => this.rebuildGrid());
  }

  buildTexture(lines) {
    const lineHeight = 16;
    const fontSize = 11;
    const padding = 10;
    const width = 160;
    const contentH = lines.length * lineHeight + padding;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = contentH;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, padding * 0.5, padding * 0.5 + i * lineHeight);
    });

    const texture = new CanvasTexture(canvas);
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = RepeatWrapping;
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    texture.repeat.y = 0.7;
    texture._contentH = contentH;

    return texture;
  }

  buildGrid() {
    const aspect = this.sizes.width / this.sizes.height;

    const depth = Math.abs(GRID_DEPTH);
    const vFov = (this.camera.fov * Math.PI) / 180;
    const viewH = 2 * depth * Math.tan(vFov / 2);
    const viewW = viewH * aspect;

    const cellSize = TILE_SIZE_WORLD + TILE_GAP;
    const cols = Math.max(1, Math.floor(viewW / cellSize));
    const rows = Math.max(1, Math.floor(viewH / cellSize));

    const gridW = cols * cellSize;
    const gridH = rows * cellSize;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseTexture =
          this.baseTextures[(row + col) % this.baseTextures.length];
        const texture = baseTexture.clone();
        texture.needsUpdate = true;
        texture._contentH = baseTexture._contentH;
        texture.offset.y = Math.random();

        const material = new MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
        });
        const geometry = new PlaneGeometry(TILE_SIZE_WORLD, TILE_SIZE_WORLD);
        const mesh = new Mesh(geometry, material);

        mesh.position.set(
          col * cellSize - gridW / 2 + cellSize / 2,
          row * cellSize - gridH / 2 + cellSize / 2,
          GRID_DEPTH,
        );

        this.group.add(mesh);
        this.tiles.push({ mesh, geometry, material, texture });
      }
    }
  }

  clearGrid() {
    this.tiles.forEach(({ mesh, geometry, material, texture }) => {
      this.group.remove(mesh);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    });
    this.tiles = [];
  }

  rebuildGrid() {
    this.clearGrid();
    this.buildGrid();
  }

  update() {
    this.tiles.forEach(({ texture }) => {
      texture.offset.y -= 0.06 / texture._contentH;
    });
  }

  destroy() {
    this.sizes.off("resize.flowerTextGrid");
    this.clearGrid();
    this.camera.remove(this.group);
    this.baseTextures.forEach((t) => t.dispose());
  }
}
