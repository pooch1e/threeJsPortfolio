import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import terrainVertexShader from './shaders/terrain/vertex.glsl';
import terrainFragmentShader from './shaders/terrain/fragment.glsl';

export default class ProceduralTerrain {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.environment = this.world.environment;
    this.resources = this.world.resources;
    this.environmentMap = this.resources.items.spruitSunset;
    this.baseMeshModel = this.resources.items.cubeBaseTest3.scene;

    //setup
    this.setBackground();
    // this.addPlaceholder();
    this.addBaseMesh();
    this.setTerrain();
    this.addLights();
  }

  setBackground() {
    if (this.environmentMap) {
      this.environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = this.environmentMap;
      this.scene.backgroundBlurriness = 0.5;
      this.scene.environment = this.environmentMap;
    }
  }

  addBaseMesh() {
    this.baseMeshModel.scale.set(3, 8, 6);
    this.baseMeshModel.position.y = -1;

    this.scene.add(this.baseMeshModel);
  }

  setTerrain() {
    this.planeGeometry = new THREE.PlaneGeometry(12, 12, 500, 500);
    this.planeGeometry.rotateX(-Math.PI * 0.5);

    // Material
    this.planeMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,

      // MeshStandardMaterial
      metalness: 0,
      roughness: 0.5,
      color: '#85d534',
    });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.planeMesh.receiveShadow = true;
    this.planeMesh.castShadow = true;
    this.scene.add(this.planeMesh);
  }

  addPlaceholder() {
    this.placeholder = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 5),
      new THREE.MeshPhysicalMaterial(),
    );
    this.scene.add(this.placeholder);
  }

  addLights() {
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 2);
    this.directionalLight.position.set(6.25, 3, 4);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 30;
    this.directionalLight.shadow.camera.top = 8;
    this.directionalLight.shadow.camera.right = 8;
    this.directionalLight.shadow.camera.bottom = -8;
    this.directionalLight.shadow.camera.left = -8;
    this.scene.add(this.directionalLight);
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {
    // destroy something

    // Lights
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight.dispose();
    }

    // Debug folder
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
