import p5 from 'p5';

export class Setup {
  constructor(WorldClass, parent = document.body) {
    this.WorldClass = WorldClass;
    this.parent = parent;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.world = null;

    this.p5Instance = new p5(this.sketch.bind(this), parent);
  }

  sketch(p) {
    this.world = new this.WorldClass(p, this.width, this.height);

    p.setup = () => {
      if (this.world) {
        this.world.setup(this.width, this.height);
      }
    };

    p.draw = () => {
      if (this.world) {
        this.world.draw();
      }
    };

    p.windowResized = () => {
      const width = this.parent.clientWidth || window.innerWidth;
      const height = this.parent.clientHeight || window.innerHeight;

      if (this.world?.windowResized) {
        this.world.windowResized(width, height);
      }
    };
  }

  dispose() {
    if (this.world?.dispose) {
      this.world.dispose();
    }
    this.p5Instance?.remove();
  }
}
