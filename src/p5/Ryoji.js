export class Ryoji {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
  }

  drawSquare() {
    this.p.rect(0, 0, this.width / 2, this.height);
  }

  setup(width, height) {
    this.p.createCanvas(width, height);
  }

  draw() {
    this.p.background(0);
    this.drawSquare();
  }

  windowResized(width, height) {
    this.p.resizeCanvas(width, height);
  }

  dispose() {}
}
