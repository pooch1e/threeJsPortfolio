import { Graphics, Text } from 'pixi.js';
import { QuadTreeNode, Boundary } from './utils/Quadtree';

const lerp = (a, b, t) => a + (b - a) * t;
const constrain = (v, min, max) => Math.min(Math.max(v, min), max);
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

let activeInstance = null;

export class AdaptivePrecision {
  constructor(app, sizes, options = {}) {
    if (activeInstance) {
      activeInstance.destroy();
    }
    activeInstance = this;

    this.app = app;
    this.sizes = sizes;
    this.options = options;

    this.cursor = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };
    this.icons = [];
    this.radius = 120;
    this.snapThreshold = 40;
    this.snapStrength = 2.0;
    this.quadtree = null;

    this.g = null;
    this.statusLabel = null;
    this.nearbyLabel = null;
  }

  async init() {
    // Set background colour
    this.app.renderer.background.color = 0x000435;

    // Single Graphics object — cleared and redrawn each frame (immediate mode)
    this.g = new Graphics();
    this.app.stage.addChild(this.g);

    // HUD text labels
    const labelStyle = { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' };
    this.statusLabel = new Text({ text: 'FREE', style: labelStyle });
    this.statusLabel.position.set(10, 10);

    this.nearbyLabel = new Text({ text: 'nearby: 0', style: labelStyle });
    this.nearbyLabel.position.set(10, 26);

    this.app.stage.addChild(this.statusLabel, this.nearbyLabel);

    // Build icon grid
    this._buildIcons();

    // Track mouse via PixiJS stage events
    this.app.stage.eventMode = 'static';
    this._onPointerMove = (e) => {
      this.mouse.x = e.global.x;
      this.mouse.y = e.global.y;
    };
    this.app.stage.on('pointermove', this._onPointerMove);

    // Seed cursor at centre
    this.cursor.x = this.sizes.width / 2;
    this.cursor.y = this.sizes.height / 2;
  }

  _buildIcons() {
    this.icons = [];
    const rows = 3;
    const cols = 3;
    const spacingX = this.sizes.width / 4;
    const spacingY = this.sizes.height / 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.icons.push({
          x: spacingX * (col + 1),
          y: spacingY * (row + 1),
        });
      }
    }
  }

  _rebuildQuadtree() {
    const boundary = new Boundary(0, 0, this.sizes.width, this.sizes.height);
    this.quadtree = new QuadTreeNode(boundary, 1);
    for (const icon of this.icons) {
      this.quadtree.insert(icon);
    }
  }

  update(/* ticker */) {
    const g = this.g;
    g.clear();

    const mx = this.mouse.x;
    const my = this.mouse.y;

    this._rebuildQuadtree();

    const range = new Boundary(
      mx - this.radius,
      my - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
    const nearbyIcons = this.quadtree.queryRange(range);

    let target = { x: mx, y: my };
    let snapped = false;
    let closestDist = Infinity;
    let closestIcon = null;

    for (const icon of nearbyIcons) {
      const d = dist(mx, my, icon.x, icon.y);

      if (d < closestDist) {
        closestDist = d;
        closestIcon = icon;
      }

      if (d < this.radius) {
        if (d < this.snapThreshold) {
          target = { x: icon.x, y: icon.y };
          snapped = true;
        } else {
          const t = 1 - (d - this.snapThreshold) / (this.radius - this.snapThreshold);
          const eased = t * t;
          target.x = lerp(mx, icon.x, eased * this.snapStrength);
          target.y = lerp(my, icon.y, eased * this.snapStrength);
          snapped = true;
        }
      }

      // Icon drawing — outer glow ring + inner solid
      const baseSize = 40;
      const hoverSize = 60;
      const hoverAmount = constrain(1 - d / this.radius, 0, 1);
      const iconSize = lerp(baseSize, hoverSize, hoverAmount);
      const r = iconSize / 2;

      g.circle(icon.x, icon.y, r).fill({ color: 0xffffff, alpha: 150 / 255 });
      g.circle(icon.x, icon.y, r * 0.6).fill(0xffffff);
    }

    // Extended attraction range for closest icon when outside primary snap zone
    if (!snapped && closestIcon && closestDist < this.radius * 1.5) {
      const t = 1 - (closestDist - this.snapThreshold) / (this.radius * 1.5 - this.snapThreshold);
      if (t > 0) {
        const eased = t * t * t;
        target.x = lerp(mx, closestIcon.x, eased * this.snapStrength * 0.5);
        target.y = lerp(my, closestIcon.y, eased * this.snapStrength * 0.5);
      }
    }

    // Smooth cursor toward target
    const lerpSpeed = snapped ? 0.3 : 0.15;
    this.cursor.x += (target.x - this.cursor.x) * lerpSpeed;
    this.cursor.y += (target.y - this.cursor.y) * lerpSpeed;

    // Cursor dot
    g.circle(this.cursor.x, this.cursor.y, 6).fill(snapped ? 0xff6b6b : 0xffffff);

    // Update HUD
    this.statusLabel.text = snapped ? 'SNAPPED' : 'FREE';
    this.nearbyLabel.text = `nearby: ${nearbyIcons.length}`;
  }

  resize(width, height) {
    this._buildIcons();
    // Re-seed cursor position proportionally would be ideal, but reset to centre is safe
    this.cursor.x = width / 2;
    this.cursor.y = height / 2;
  }

  destroy() {
    if (this._onPointerMove) {
      this.app.stage.off('pointermove', this._onPointerMove);
      this._onPointerMove = null;
    }
    this.icons = [];
    this.quadtree = null;
    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}
