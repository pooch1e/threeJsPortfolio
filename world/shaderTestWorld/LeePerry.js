import * as THREE from 'three';

export default class LeePerry {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources;
    this.customUniforms = {
      uTime: { value: 0 },
    };

    // setup
    this.resource = this.resources.items.leePerryModel;
    this.setModel();
    this.setPlane();
    this.setDebug();
  }

  setModel() {
    this.model = this.resource.scene;
    this.material = this.model.material;
    this.model.scale.set(0.2, 0.2, 0.2);
    const leeColor = this.resources.items.leePerryColor;
    const leeNormal = this.resources.items.leePerryNormal;

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: leeColor,
          normalMap: leeNormal,
        });

        child.material.onBeforeCompile = (shader) => {
          shader.uniforms.uTime = this.customUniforms.uTime;
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            uniform float uTime;

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }
            `
          );

          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            
            float angle = position.y + uTime;
            mat2 rotateMatrix = get2dRotateMatrix(angle);
            transformed.xz = rotateMatrix * transformed.xz;
            `
          );
        };
      }
    });

    if (this.environment && this.environment.environmentMap) {
      this.environment.environmentMap.updateMaterials();
    }
    this.scene.add(this.model);
  }

  setPlane() {
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15, 15),
      new THREE.MeshStandardMaterial()
    );

    this.plane.rotation.y = Math.PI;
    this.plane.position.y = 0;
    this.plane.position.z = 5;

    this.scene.add(this.plane);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Lee Perry GUI');

      this.debugFolder
        .add(this.customUniforms.uTime, 'value')
        .min(0)
        .max(2)
        .step(0.01)
        .name('uTime');
    }
  }

  destroy() {
    // Model
    if (this.model) {
      this.scene.remove(this.model);
      this.model.traverse((child) => {
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

    // Plane
    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane.geometry?.dispose();
      this.plane.material?.dispose();
    }

    if (this.debugFolder) {
      this.debug.ui.destroy();
    }
  }

  update(time) {
    if (time && time.elapsedTime !== undefined) {
      this.customUniforms.uTime.value = time.elapsedTime * 0.002;
    }
  }
}
