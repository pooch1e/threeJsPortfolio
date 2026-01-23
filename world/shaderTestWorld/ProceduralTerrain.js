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

  addBaseMesh() {
    this.baseMeshModel.scale.set(3, 8, 6);
    this.baseMeshModel.position.y = -1;

    this.scene.add(this.baseMeshModel);
  }

  setTerrain() {
    this.planeGeometry = new THREE.PlaneGeometry(11.5, 11.5, 500, 500);
    this.planeGeometry.deleteAttribute('normal');
    this.planeGeometry.deleteAttribute('uv');
    this.planeGeometry.rotateX(-Math.PI * 0.5);

    // Material
    this.colors = {
      waterDeep: '#002b3d',
      waterSurface: '#66a8ff',
      sand: '#ffe894',
      grass: '#85d534',
      snow: '#ffffff',
      rock: '#bfbd8d',
    };

    this.uniforms = {
      uPositionFrequency: new THREE.Uniform(0.2),
      uStrength: new THREE.Uniform(2.0),
      uWarpFrequency: new THREE.Uniform(5),
      uWarpStrength: new THREE.Uniform(0.5),
      uTime: new THREE.Uniform(0),
      uColorWaterDeep: new THREE.Uniform(
        new THREE.Color(this.colors.waterDeep),
      ),
      uColorWaterSurface: new THREE.Uniform(
        new THREE.Color(this.colors.waterSurface),
      ),
      uColorSand: new THREE.Uniform(new THREE.Color(this.colors.sand)),
      uColorGrass: new THREE.Uniform(new THREE.Color(this.colors.grass)),
      uColorSnow: new THREE.Uniform(new THREE.Color(this.colors.snow)),
      uColorRock: new THREE.Uniform(new THREE.Color(this.colors.rock)),
    };

    this.planeMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,

      // MeshStandardMaterial
      metalness: 0,
      roughness: 0.5,
      color: '#85d534',
      uniforms: this.uniforms,
    });

    this.planeDepthMaterial = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshDepthMaterial,

      vertexShader: terrainVertexShader,
      uniforms: this.uniforms,

      // MeshDepthMaterial
      depthPacking: THREE.RGBADepthPacking,
    });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.planeMesh.position.y = 0.5;
    this.planeMesh.receiveShadow = true;
    this.planeMesh.castShadow = true;
    this.planeMesh.customDepthMaterial = this.planeDepthMaterial;
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
      this.uniforms.uTime.value = time.elapsedTime * 0.02;
    }
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Procedural Terrain');

      this.debugFolder
        .add(this.uniforms.uPositionFrequency, 'value', 0, 1, 0.001)
        .name('uPositionFrequency');
      this.debugFolder
        .add(this.uniforms.uStrength, 'value', 0, 10, 0.001)
        .name('uStrength');
      this.debugFolder
        .add(this.uniforms.uWarpFrequency, 'value', 0, 10, 0.001)
        .name('uWarpFrequency');
      this.debugFolder
        .add(this.uniforms.uWarpStrength, 'value', 0, 1, 0.001)
        .name('uWarpStrength');

      // colors
      this.debugFolder
        .addColor(this.colors, 'waterDeep')
        .onChange(() =>
          this.uniforms.uColorWaterDeep.value.set(this.colors.waterDeep),
        );
      this.debugFolder
        .addColor(this.colors, 'waterSurface')
        .onChange(() =>
          this.uniforms.uColorWaterSurface.value.set(this.colors.waterSurface),
        );
      this.debugFolder
        .addColor(this.colors, 'sand')
        .onChange(() => this.uniforms.uColorSand.value.set(this.colors.sand));
      this.debugFolder
        .addColor(this.colors, 'grass')
        .onChange(() => this.uniforms.uColorGrass.value.set(this.colors.grass));
      this.debugFolder
        .addColor(this.colors, 'snow')
        .onChange(() => this.uniforms.uColorSnow.value.set(this.colors.snow));
      this.debugFolder
        .addColor(this.colors, 'rock')
        .onChange(() => this.uniforms.uColorRock.value.set(this.colors.rock));
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
