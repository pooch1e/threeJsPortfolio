import { QuadTreeNode, Boundary } from './utils/Quadtree';

let activeInstance = null;
import glow from '../../static/textures/glow/glow.png'

export class AdaptivePrecision {
  constructor(p, width, height) {
    if (activeInstance) {
      activeInstance.dispose();
    }
    activeInstance = this;

    this.p = p;
    this.width = width;
    this.height = height;
    this.cursor = null;
    this.icons = [];
    this.radius = 120;
    this.snapThreshold = 40;
    this.snapStrength = 2.0;

    this.quadtree = null;
  }

  setup() {
    this.p.createCanvas(this.width, this.height);

    this.cursor = this.p.createVector(this.p.mouseX, this.p.mouseY);
    this.reactImage = glow;
    this.icons = [];
    const rows = 3;
    const cols = 3;
    const spacingX = this.width / 4;
    const spacingY = this.height / 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = spacingX * (col + 1);
        const y = spacingY * (row + 1);
        this.icons.push(this.p.createVector(x, y));
      }
    }
  }

  rebuildQuadtree() {
    const boundary = new Boundary(0, 0, this.width, this.height);
    this.quadtree = new QuadTreeNode(boundary, 1);

    for (const icon of this.icons) {
      this.quadtree.insert(icon);
    }
  }

  draw() {
    this.p.background('#000435');

    const mousePos = this.p.createVector(this.p.mouseX, this.p.mouseY);

    this.rebuildQuadtree();

    const range = new Boundary(
      mousePos.x - this.radius,
      mousePos.y - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
    const nearbyIcons = this.quadtree.queryRange(range);

    let target = mousePos;
    let snapped = false;
    let closestDist = Infinity;
    let closestIcon = null;

    for (const icon of nearbyIcons) {
      const d = this.p.dist(mousePos.x, mousePos.y, icon.x, icon.y);

      if (d < closestDist) {
        closestDist = d;
        closestIcon = icon;
      }

      if (d < this.radius) {
        if (d < this.snapThreshold) {
          target = icon.copy();
          snapped = true;
        } else {
          const t =
            1 - (d - this.snapThreshold) / (this.radius - this.snapThreshold);
          const eased = t * t;
          target.x = this.p.lerp(mousePos.x, icon.x, eased * this.snapStrength);
          target.y = this.p.lerp(mousePos.y, icon.y, eased * this.snapStrength);
          snapped = true;
        }
      }

      const baseSize = 40;
      const hoverSize = 60;
      const hoverAmount = this.p.constrain(1 - d / this.radius, 0, 1);
      const iconSize = this.p.lerp(baseSize, hoverSize, hoverAmount);

      this.p.noStroke();
      this.p.fill(255, 255, 255, 150);
      this.p.circle(icon.x, icon.y, iconSize);

      this.p.fill(255);
      this.p.circle(icon.x, icon.y, iconSize * 0.6);
    }

    if (!snapped && closestIcon && closestDist < this.radius * 1.5) {
      const t =
        1 -
        (closestDist - this.snapThreshold) /
          (this.radius * 1.5 - this.snapThreshold);
      if (t > 0) {
        const eased = t * t * t;
        target.x = this.p.lerp(
          mousePos.x,
          closestIcon.x,
          eased * this.snapStrength * 0.5,
        );
        target.y = this.p.lerp(
          mousePos.y,
          closestIcon.y,
          eased * this.snapStrength * 0.5,
        );
      }
    }

    this.cursor.lerp(target, snapped ? 0.3 : 0.15);

    this.p.fill(snapped ? '#ff6b6b' : '#ffffff');
    this.p.noStroke();
    this.p.circle(this.cursor.x, this.cursor.y, 12);

    this.p.fill(255, 100);
    this.p.textSize(11);
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.text(snapped ? 'SNAPPED' : 'FREE', 10, 10);
    this.p.text(`nearby: ${nearbyIcons.length}`, 10, 26);
  }

  windowResized(width, height) {
    this.p.resizeCanvas(width, height);
  }

  dispose() {
    this.icons = [];
    this.cursor = null;
    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}
