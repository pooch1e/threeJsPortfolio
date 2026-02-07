import p5 from 'p5';

export class Ryoki {
  constructor(p) {
    this.p = p;
  }

  setup(height, width) {
    this.p.createCanvas(height, width);
  }

  draw() {}

  windowResized(height, width) {
    this.p.resizeCanvas(height, width);
  }

  dispose() {}
}
