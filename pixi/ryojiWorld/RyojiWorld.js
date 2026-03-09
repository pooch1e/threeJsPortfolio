import { RyojiGrid } from './RyojiGrid';

export class RyojiWorld {
  constructor(experience) {
    this.experience = experience;
    this.grid = new RyojiGrid(this);
  }

  init() {
    return this.grid.init?.();
  }

  update(ticker) {
    this.grid.update?.(ticker);
  }

  resize(width, height) {
    this.grid.resize?.(width, height);
  }

  destroy() {
    this.grid.destroy?.();
  }
}
