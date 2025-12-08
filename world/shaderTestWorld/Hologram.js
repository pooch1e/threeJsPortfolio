import * as THREE from 'three';
import holographicVertex from './shaders/holographic/vertex.glsl';
import holographicFragment from './shaders/holographic/fragment.glsl';
export default class Hologram {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    this.paramaters = {
      color: '#70c1ff',
    };

    // Setup
    this.material = new THREE.ShaderMaterial({
      vertexShader: holographicVertex,
      fragmentShader: holographicFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uColor: new THREE.Uniform(new THREE.Color(this.paramaters.color)),
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
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
    this.sphereMesh.position.x = 1;
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
    this.torusMesh.position.x = -2;
    this.torusMesh.position.y = 2;

    this.scene.add(this.torusMesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Holograph UI');

      this.debugFolder.addColor(this.paramaters, 'color').onChange(() => {
        this.material.uniforms.uColor.value.set(this.paramaters.color);
      });
    }
  }
  update(time) {
    if (time && this.material) {
      // Sphere
      this.sphereMesh.rotation.x = time.elapsedTime * 0.002;
      this.sphereMesh.rotation.y = time.elapsedTime * 0.001;

      // Suzanne
      this.suzanneModel.rotation.x = time.elapsedTime * 0.002;
      this.suzanneModel.rotation.y = time.elapsedTime * 0.001;

      // Torus
      this.torusMesh.rotation.x = time.elapsedTime * 0.002;
      this.torusMesh.rotation.y = time.elapsedTime * 0.001;

      // Uniforms

      this.material.uniforms.uTime.value = time.elapsedTime;
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
}
