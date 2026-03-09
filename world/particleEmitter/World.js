import { Particles } from './Particles';
export class World {
  constructor(particleEmitterExperience) {
    this.particleEmitterExperience = particleEmitterExperience;
    this.scene = this.particleEmitterExperience.scene;
    this.mouse = this.particleEmitterExperience.mouse;
    this.particles = new Particles(this);
  }

  update(time) {
    if (this.particles) {
      this.particles.update(time);
    }
  }

  destroy() {}
}
