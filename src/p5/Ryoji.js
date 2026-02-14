import { Vector2 } from 'three';

export class Ryoji {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
    this.randomPos = new Vector2(p.random(0, this.width/2), p.random(0, this.height/2));
  }

  setup(width, height) {
    this.p.createCanvas(width, height);
  }

  draw() {
    this.p.background(0);
    this.p.rect(this.x, this.y, this.randomPos.x, this.randomPos.y);
  }

  windowResized(width, height) {
    this.p.resizeCanvas(width, height);
  }

  dispose() {}
}
