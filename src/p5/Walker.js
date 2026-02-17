
export class Walker {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
  }

  setup() {
    this.p.createCanvas(this.width, this.height);

  }

  draw() {
    this.p.point(this.width/2, this.height/2)
  }
}
