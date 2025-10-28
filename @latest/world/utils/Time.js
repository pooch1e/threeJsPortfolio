import EventEmitter from './EventEmitter';

export class Time extends EventEmitter {
  constructor() {
    super();

    //Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsedTime = 0;
    this.deltaTime = 16;

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    const currentTime = Date.now();
    this.deltaTime = currentTime - this.current;
    this.current = currentTime;
    this.elapsedTime = this.current - this.start;

    this.trigger('tick');

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }
}
