import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/Addons.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
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
    this.setText();
  }

  setModels() {
    this.setSphere();
    this.setSuzanne();
    this.setTorus();
    this.setLightHelper(); // can comment this out if needed
  }

  async setText() {
    const loader = new FontLoader();
    let font;

    try {
      font = await loader.loadAsync(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json'
      );
    } catch (error) {
      console.error('Failed to load font:', error);
      return;
    }

    const geometry = new TextGeometry(
      'See source code for more light shader options!',
      {
        font: font,
        size: 0.2,
        depth: 0.2,
        curveSegments: 12,
      }
    );

    geometry.center();

    this.textMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    this.textMesh.position.y = 1.5;
    this.scene.add(this.textMesh);
  }

  setSphere() {
    this.sphereGeometry = new THREE.SphereGeometry(1);

    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.material);
    this.sphereMesh.position.x = 4;

    this.scene.add(this.sphereMesh);
  }

  setSuzanne() {
    this.suzanneModel = this.resource.scene;
    this.suzanneModel.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });

    this.scene.add(this.suzanneModel);
  }

  setTorus() {
    this.torusGeometry = new THREE.TorusKnotGeometry(1);
    this.torusMesh = new THREE.Mesh(this.torusGeometry, this.material);
    this.torusMesh.position.x = -4;

    this.scene.add(this.torusMesh);
  }

  setLightHelper() {
    this.directionalLightHelper = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial()
    );
    this.directionalLightHelper.material.color.setRGB(0.1, 0.1, 1);
    this.directionalLightHelper.material.side = THREE.DoubleSide;
    this.directionalLightHelper.position.set(0, 0, 3);

    this.pointLightHelper = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicMaterial()
    );
    this.pointLightHelper.material.color.setRGB(1, 0.1, 0.1);
    this.pointLightHelper.position.set(0, 2.5, 0);

    this.scene.add(this.pointLightHelper);
    this.scene.add(this.directionalLightHelper);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Lighting Basics');

      this.debugFolder.addColor(this.materialConfig, 'color').onChange(() => {
        this.material.uniforms.uColor.value.set(this.materialConfig.color);
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
    if (this.directionalLightHelper) {
      this.scene.remove(this.directionalLightHelper);
      this.directionalLightHelper.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          this.material?.dispose();
        }
      });
      if (this.pointLightHelper) {
        this.scene.remove(this.pointLightHelper);
        this.pointLightHelper.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            this.material?.dispose();
          }
        });
      }
    }

    // Clean up text
    if (this.textMesh) {
      this.scene.remove(this.textMesh);
      this.textMesh.geometry?.dispose();
    }
  }

  update(time) {
    if (time && this.material) {
      // Rotate objects
      if (this.suzanneModel) {
        this.suzanneModel.rotation.x = time.elapsedTime * 0.001;
        this.suzanneModel.rotation.y = time.elapsedTime * 0.002;
      }

      this.sphereMesh.rotation.x = time.elapsedTime * 0.001;
      this.sphereMesh.rotation.y = time.elapsedTime * 0.002;

      this.torusMesh.rotation.x = time.elapsedTime * 0.001;
      this.torusMesh.rotation.y = time.elapsedTime * 0.002;
    }
  }
}
