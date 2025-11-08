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
    try {
      const shaderModule = await shaderPractices[key]();
      const ShaderClass = shaderModule.default;
      this.shader = new ShaderClass(this);
    } catch (err) {
      console.error(`Failed to load ${key}, falling back to basicShader:`, err);

      if (key === 'basicShader') {
        console.error('basicShader failed to load, cannot recover');
        return;
      }

      try {
        const shaderModule = await shaderPractices['basicShader']();
        const ShaderClass = shaderModule.default;
        this.shader = new ShaderClass(this);
      } catch (fallbackErr) {
        console.error('Fallback to basicShader also failed:', fallbackErr);
      }
    }
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
