import { Particles } from './Particles';
export class ParticleEmitterWorld {
  constructor(experience) {
    this.experience = experience;
    this.particles = new Particles(this);
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
