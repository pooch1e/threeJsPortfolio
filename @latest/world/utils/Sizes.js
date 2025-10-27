export class Sizes {
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = () => {
      return this.width / this.height;
    };
    this.pixelRation = Math.min((window.devicePixelRatio, 2));
  }
}
