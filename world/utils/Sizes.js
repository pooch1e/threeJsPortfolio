import EventEmitter from './EventEmitter';

// Assuming window size always fills canvas
export class Sizes extends EventEmitter {
  constructor() {
    super();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Resize event
    this._onResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.trigger('resize');
    };
    window.addEventListener('resize', this._onResize);

    this.trigger('resize');
  }

  get aspect() {
    return this.width / this.height;
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
  }
}
