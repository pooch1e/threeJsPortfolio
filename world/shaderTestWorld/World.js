import { ThreeJsShader } from './ThreeJsShader';

export class World {
  constructor(shaderExperience) {
    this.shaderExperience = shaderExperience;
    this.scene = this.shaderExperience.scene;
    

    this.shader = new ThreeJsShader(this);
  }

  update(time) {
    if (this.shader) {
      this.shader.update(time)
    }
  }
}
