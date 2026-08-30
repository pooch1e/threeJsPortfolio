/**
 * Composition root for the Shader scene. Unlike the other worlds this one
 * swaps its content at runtime: requestShader() lazily imports a shader
 * module from shaderConfig and replaces the live instance, emitting
 * loadstart/loadcomplete for the React UI.
 */
import { shaderPractices } from './shaderConfig';
import { Environment } from './Environment.js';
import { Helpers } from '../utils/Helpers.js';
import EventEmitter from '../utils/EventEmitter.js';
export class World extends EventEmitter {
constructor(experience) {
    super();
    this.experience = experience;
    this.scene = experience.scene;
    this.shader = null;

    this.resources = experience.resources;
    this.helpers = new Helpers(this);
    this.pendingShaderKey = 'basicShader';
    this.pendingCanvas2D = null;

    this.resources.on('ready', () => {
      this.loadPractice(this.pendingShaderKey, this.pendingCanvas2D);
    });
  }

  // Entry point for shader selection from React. Resources reload from
  // scratch on every remount (e.g. toggling debug mode), so a shader
  // requested before they're ready is deferred until the 'ready' event
  // instead of racing loadPractice against still-empty resources.items.
  requestShader(key, canvas2D = null) {
    if (this.resources.isReady) {
      this.loadPractice(key, canvas2D);
    } else {
      this.pendingShaderKey = key;
      this.pendingCanvas2D = canvas2D;
    }
  }

  async loadPractice(key, canvas2D = null) {
    const oldShader = this.shader;

    this.trigger('loadstart', [{ shaderKey: key }]);

    try {
      const shaderModule = await shaderPractices[key]();
      const ShaderClass = shaderModule.default;
      this.shader = new ShaderClass(this, canvas2D);

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

        this.trigger('loadcomplete', [{ shaderKey: 'basicShader', fallback: true }]);
      } catch (fallbackErr) {
        console.error('Fallback to basicShader also failed:', fallbackErr);
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
