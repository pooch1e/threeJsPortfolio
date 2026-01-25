import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import slicedVertexShader from './shaders/slicedGear/vertex.glsl';
import slicedFragmentShader from './shaders/slicedGear/fragment.glsl';
export default class SlicedModel {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources;
    this.environmentMap = this.resources.items.aerodynamicMapTexture;
    this.model = this.resources.items.gearsModel;

    // Setup
    this.setBackground();
    this.addLights();
    this.addGearModel();
    this.addPlane();
    this.setDebug();
  }

  setBackground() {
    if (this.environmentMap) {
      this.environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = this.environmentMap;
      this.scene.backgroundBlurriness = 0.5;
      this.scene.environment = this.environmentMap;
    }
  }
  addLights() {
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 4);
    this.directionalLight.position.set(6.25, 3, 4);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 30;
    this.directionalLight.shadow.normalBias = 0.05;
    this.directionalLight.shadow.camera.top = 8;
    this.directionalLight.shadow.camera.right = 8;
    this.directionalLight.shadow.camera.bottom = -8;
    this.directionalLight.shadow.camera.left = -8;
    this.scene.add(this.directionalLight);
  }

  addPlane() {
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#aaaaaa' }),
    );
    this.plane.receiveShadow = true;
    this.plane.position.x = -4;
    this.plane.position.y = -3;
    this.plane.position.z = -4;
    this.plane.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.plane);
  }

  addGearModel() {
    this.uniforms = {
      uSliceStart: new THREE.Uniform(1.75),
      uSliceArc: new THREE.Uniform(1.25),
    };

    // Material
    this.material = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 0.25,
      envMapIntensity: 0.5,
      color: '#858080',
    });
    this.slicedMaterial = new CustomShaderMaterial({
      //CSM
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: slicedVertexShader,
      fragmentShader: slicedFragmentShader,

      // Mesh Standard Material
      metalness: 0.5,
      roughness: 0.25,
      envMapIntensity: 0.5,
      color: '#858080',
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
    });
    this.slicedDepthMaterial = new CustomShaderMaterial({
      //CSM
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: slicedVertexShader,
      fragmentShader: slicedFragmentShader,

      depthPacking: THREE.RGBADepthPacking,
    });

    this.model.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'outerHull') {
          child.material = this.slicedMaterial;
          child.depthPacking = this.slicedDepthMaterial;
        } else {
          child.material = this.material;
          
        }

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(this.model.scene);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Sliced Model');

      this.debugFolder
        .add(this.uniforms.uSliceStart, 'value', -Math.PI, Math.PI, 0.001)
        .name('uSliceStart');
      this.debugFolder
        .add(this.uniforms.uSliceArc, 'value', 0, Math.PI * 2, 0.001)
        .name('uSliceArc');
    }
  }

  update(time) {
    if (time) {
      if (this.model) {
        this.model.scene.rotation.y = time.elapsedTime * 0.0002;
      }
    }
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane.geometry.dispose();
      this.plane.material.dispose();
    }

    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight.dispose();
    }

    // Clear scene background and environment
    if (this.scene.background === this.environmentMap) {
      this.scene.background = null;
    }
    if (this.scene.environment === this.environmentMap) {
      this.scene.environment = null;
    }
  }
}
