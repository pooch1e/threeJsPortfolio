import p5 from 'p5';
export class Setup {
  constructor(
    WorldClass,
    canvasWidth = window.innerWidth,
    canvasHeight = window.innerHeight,
    parent = document.body, // may check this with react
  ) {
    this.WorldClass = WorldClass;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.parent = parent;
    this.world = null;

    this.p5Instance = new p5(this.sketch.bind(this), parent);
  }

  sketch(p) {
    this.world = new this.WorldClass(p);

    p.setup = () => {
      if (this.world) {
        this.world.setup(this.canvasHeight, this.canvasWidth);
      }
    };

    p.draw = () => {
      if (this.world) {
        this.world.draw();
      }

      p.windowResized = () => {
        if (this.world.windowResized) {
          this.world.windowResized(this.canvasHeight, this.canvasWidth);
        }
      };
    };
  }

  dispose() {
    if (this.world?.dispose) {
      this.world.dispose();
    }
    this.p5Instance?.remove();
  }
}
