import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass';

export default class PostProcessing {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.resources = this.world.resources;
    this.renderer = this.world.shaderExperience.renderer;
    this.camera = this.world.shaderExperience.camera.camera;
    this.debug = this.world.shaderExperience.debug;

    this.renderer = this.world.shaderExperience.renderer;
    console.log(this.renderer);

    // Textures and Models
    this.background = this.resources.items.environmentMapTexture;
    this.model = this.resources.items.helmetModel;

    // Init Composer and Pass
    this.effectComposer = new EffectComposer(this.renderer.renderer);
    this.effectComposer.setSize(
      this.renderer.sizes.width,
      this.renderer.sizes.height,
    );
    this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderPass = new RenderPass(this.world.scene, this.camera);
    this.effectComposer.addPass(this.renderPass);

    // Setup
    this.setBackground();
    this.setLights();
    this.setModel();
    this.setDebug();
    this.setPasses();
  }

  setBackground() {
    if (this.background) {
      this.scene.background = this.background;
      this.scene.environment = this.background;
    }
  }

  setLights() {
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 3);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.far = 15;
    this.directionalLight.shadow.normalBias = 0.05;
    this.directionalLight.position.set(0.25, 3, -2.25);
    this.scene.add(this.directionalLight);
  }

  setModel() {
    if (this.model) {
      this.model.scene.scale.set(2, 2, 2);
      this.model.scene.rotation.y = Math.PI * 0.5;

      // update materials
      this.model.scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.envMapIntensity = 2.5;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(this.model.scene);
    }
  }

  setPasses() {
    this.dotScreen = new DotScreenPass();
    this.effectComposer.addPass(this.dotScreen);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Post Processing');
    }
  }

  update(time) {
    if (time) {
      this.effectComposer.render();
    }
  }

  destroy() {
    // Remove and dispose model
    if (this.model && this.model.scene) {
      this.scene.remove(this.model.scene);
      this.model.scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Remove and dispose lights
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight.dispose();
    }

    // Dispose effect composer and passes
    if (this.effectComposer) {
      this.effectComposer.dispose();
    }

    // Clear scene background and environment
    if (this.scene.background === this.background) {
      this.scene.background = null;
    }
    if (this.scene.environment === this.background) {
      this.scene.environment = null;
    }

    // Destroy debug folder
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
