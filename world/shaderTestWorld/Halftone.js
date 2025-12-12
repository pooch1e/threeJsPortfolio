import * as THREE from 'three';
import halftoneVertexShader from './shaders/halftone/vertex.glsl';
import halftoneFragmentShader from './shaders/halftone/fragment.glsl';
export default class Halftone {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;
    this.resource = this.resources.items.suzanneModel;
    this.sizes = this.world.shaderExperience.sizes;

    this.materialParameters = { color: '#ff794d' };

    this.setModels();
    this.setDebug();
  }

  setModels() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: halftoneVertexShader,
      fragmentShader: halftoneFragmentShader,
      uniforms: {
        uColor: new THREE.Uniform(
          new THREE.Color(this.materialParameters.color)
        ),
        uShadeColor: new THREE.Uniform(
          new THREE.Color(this.materialParameters.shadeColor)
        ),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
      },
    });

    this.suzanneModel = this.resource.scene;
    this.suzanneModel.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });

    this.scene.add(this.suzanneModel);
  }

  update(time) {
    if (time && this.suzanneModel) {
      // Suzanne
      this.suzanneModel.rotation.x = time.elapsedTime * 0.002;
      this.suzanneModel.rotation.y = time.elapsedTime * 0.001;
    }
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Halftone UI');

      this.debugFolder
        .addColor(this.materialParameters, 'color')
        .onChange(() => {
          this.material.uniforms.uColor.value.set(
            this.materialParameters.color
          );
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
  }
}
