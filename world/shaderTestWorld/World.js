import { shaderPractices } from './shaderConfig';
import { Environment } from './Environment.js';
import { Resources } from '../utils/Resources.js';
import { sources } from '../sources/sources.js';
import { Helpers } from '../utils/Helpers.js';
import EventEmitter from '../utils/EventEmitter.js';
export class World extends EventEmitter {
constructor(shaderExperience) {
    super();
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

  async loadPractice(key, canvas2D = null) {
    // Store reference to old shader
    const oldShader = this.shader;

    // Emit loading start event
    this.trigger('loadstart', [{ shaderKey: key }]);

    // load new shader
    try {
      const shaderModule = await shaderPractices[key]();
      const ShaderClass = shaderModule.default;
      this.shader = new ShaderClass(this, canvas2D);

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

      // Emit loading complete event
      this.trigger('loadcomplete', [{ shaderKey: key }]);
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

        // Emit loading complete for fallback
        this.trigger('loadcomplete', [{ shaderKey: 'basicShader', fallback: true }]);
      } catch (fallbackErr) {
        console.error('Fallback to basicShader also failed:', fallbackErr);
        // Emit loading complete even on failure
        this.trigger('loadcomplete', [{ shaderKey: key, error: true }]);
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
