
export class AdaptivePrecision {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
  }

  setup(width, height) {
    this.width = width;
    this.height = height;
    this.p.createCanvas(width, height);
    };


  draw() {
    this.p.background("#000435");
  }

  windowResized(width, height) {
    this.width = width;
    this.height = height;
    this.p.resizeCanvas(width, height);
    this.calculateGrid();
    this.initCells();
  }

  // dispose() {
  //   this.audio.dispose();
  // }
}
