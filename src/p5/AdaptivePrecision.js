let activeInstance = null;

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
  }

  setup() {
    this.p.createCanvas(this.width, this.height);

    this.cursor = this.p.createVector(this.p.mouseX, this.p.mouseY);

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

  draw() {
    this.p.background('#000435');
    let target = this.p.createVector(this.p.mouseX, this.p.mouseY);
    console.log(target, 'target');
    // console.log(target.values)
    let strongest = 0;

    for (let icon of this.icons) {
      let d = this.p.dist(this.p.mouseX, this.p.mouseY, icon.x, icon.y);

      if (d < this.radius) {
        let strength = 1 - d / this.radius;

        if (strength > strongest) {
          strongest = strength;
          target = icon.copy();
        }
      }

      const baseSize = 60;
      const hoverSize = 90;
      const iconRadius = baseSize / 2; // "on top" of icon
      const hoverAmount = this.p.constrain(1 - d / iconRadius, 0, 1);
      const iconSize = this.p.lerp(baseSize, hoverSize, hoverAmount);

      // draw icon
      this.p.fill(255);
      this.p.circle(icon.x, icon.y, iconSize);
    }

    // smooth snap
    this.cursor.lerp(target, 0.4);
    console.log(this.cursor, 'cursor vector');

    // draw cursor proxy
    this.p.fill(255, 100, 100);
    this.p.circle(this.cursor.x, this.cursor.y, 12);

    
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
