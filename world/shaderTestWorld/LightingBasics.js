import * as THREE from 'three';
import lightingVertex from './shaders/lightingBasics/vertex.glsl';
import lightingFragment from './shaders/lightingBasics/fragment.glsl';
export default class LightingBasics {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    this.materialConfig = {
      color: '#ffffff',
    };

    // Set same material for all - before setting models
    this.material = new THREE.ShaderMaterial({
      vertexShader: lightingVertex,
      fragmentShader: lightingFragment,
      uniforms: {
        uColor: new THREE.Uniform(new THREE.Color(this.materialConfig.color)),
      },
    });

    // Setup
    this.resource = this.resources.items.suzanneModel;
    this.setModels();
    this.setDebug();
  }

  setModels() {
    this.setSphere();
    this.setSuzanne();
    this.setTorus();
  }

  setSphere() {
    this.sphereGeometry = new THREE.SphereGeometry(1);

    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.material);
    this.sphereMesh.position.x = 4;
    this.sphereMesh.position.y = 2;
    this.scene.add(this.sphereMesh);
  }

  setSuzanne() {
    this.suzanneModel = this.resource.scene;
    this.suzanneModel.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });

    this.suzanneModel.position.y = 2;

    this.scene.add(this.suzanneModel);
  }

  setTorus() {
    this.torusGeometry = new THREE.TorusKnotGeometry(1);
    this.torusMesh = new THREE.Mesh(this.torusGeometry, this.material);
    this.torusMesh.position.x = -4;
    this.torusMesh.position.y = 2;

    this.scene.add(this.torusMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Lighting Basics');
      this.debugFolder.addColor(this.materialConfig, 'color').onChange(() => {
        this.material.uniforms.uColor.value.set(this.paramaters.color);
      });
    }
  }

  destroy() {
    // Model
    if (this.suzanneModel) {
      this.scene.remove(this.suzanneModel);
      this.suzanneModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();

          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            if (child.material.normalMap) child.material.normalMap.dispose();
            child.material.dispose();
          }
        }
      });
    }

    if (this.sphereMesh) {
      this.scene.remove(this.sphereMesh);
      this.sphereMesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          this.material?.dispose();
        }
      });
    }
    if (this.torusMesh) {
      this.scene.remove(this.torusMesh);
      this.torusMesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          this.material?.dispose();
        }
      });
    }
  }

  update(time) {
    if (time && this.material) {
    }
  }
}
