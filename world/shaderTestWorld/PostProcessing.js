import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';

export default class PostProcessing {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.resources = this.world.resources;
    this.renderer = this.world.shaderExperience.renderer;
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

    // Setup
    this.setBackground();
    this.setLights();
    this.setModel();
    this.setDebug();
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

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Post Processing');
    }
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {}
}
