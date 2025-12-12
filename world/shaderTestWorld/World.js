import { shaderPractices } from './shaderConfig';
import { Environment } from './Environment.js';
import { Resources } from '../utils/Resources.js';
import { sources } from '../sources/sources.js';
import { Helpers } from '../utils/Helpers.js';

export class World {
  constructor(shaderExperience) {
    this.shaderExperience = shaderExperience;
    this.scene = this.shaderExperience.scene;
    this.shader = null;

    this.resources = new Resources(sources);
    this.helpers = new Helpers(this);

    this.resources.on('ready', () => {
      //default
      this.loadPractice('basicShader');
    });
  }

  async loadPractice(key) {
    // Store reference to old shader
    const oldShader = this.shader;

    // load new shader
    try {
      const shaderModule = await shaderPractices[key]();
      const ShaderClass = shaderModule.default;
      this.shader = new ShaderClass(this);

      // clean up old environment if exists
      if (this.environment) {
        this.scene.environment = null;
        this.scene.background = null;
        this.environment = null;
      }

      if (key === 'leePerryShader') {
        this.environment = new Environment(this);
      }

      // Clean up old shader AFTER new one is created
      if (oldShader) {
        if (typeof oldShader.destroy === 'function') {
          oldShader.destroy();
        } else {
          this.scene.remove(oldShader.mesh);
          oldShader.geometry?.dispose();
          oldShader.shaderMaterial?.dispose();
        }
      }
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

        if (oldShader) {
          if (typeof oldShader.destroy === 'function') {
            oldShader.destroy();
          } else {
            this.scene.remove(oldShader.mesh);
            oldShader.geometry?.dispose();
            oldShader.shaderMaterial?.dispose();
          }
        }
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
      if (typeof this.shader.destroy === 'function') {
        this.shader.destroy();
      } else {
        this.scene.remove(this.shader.mesh);
        this.shader.geometry?.dispose();
        this.shader.shaderMaterial?.dispose();
      }
      this.shader = null;
    }
  }
}
