import { shaderPractices } from './shaderConfig';

export class World {
  constructor(shaderExperience) {
    this.shaderExperience = shaderExperience;
    this.scene = this.shaderExperience.scene;
    this.shader = null;

    //default
    this.loadPractice('basicShader');
  }

  async loadPractice(key) {
    if (this.shader) {
      this.scene.remove(this.shader.mesh);
      this.shader.geometry?.dispose();
      this.shader.shaderMaterial?.dispose();
      this.shader = null;
    }

    // load new shader
    const shaderModule = await shaderPractices[key]();
    const ShaderClass = shaderModule.BasicShader || shaderModule.default;
    this.shader = new ShaderClass(this);
  }

  update(time) {
    if (this.shader) {
      this.shader.update(time);
    }
  }

  destroy() {
    if (this.shader) {
      this.scene.remove(this.shader.mesh);
      this.shader.geometry?.dispose();
      this.shader.shaderMaterial?.dispose();
      this.shader = null;
    }
  }
}
