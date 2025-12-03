import * as THREE from 'three';
import coffeeVertex from './shaders/coffeeSmoke/vertex.glsl';
import coffeeFragment from './shaders/coffeeSmoke/fragment.glsl';
import { uniform } from 'three/tsl';
export default class CoffeeSmoke {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.resources = this.world.resources;

    // Mouse position uniform
    this.mousePos = {
      x: 0,
      y: 0,
    };

    // setup
    this.resource = this.resources.items.coffeeSmokeModel;
    this.smokeTexture = this.resources.items.perlinNoisePng;
    this.setModel();
    this.setSmoke();
    this.setDebug();
  }

  setModel() {
    this.model = this.resource.scene;

    const bakedMesh = this.model.getObjectByName('baked');
    if (bakedMesh && bakedMesh.material && bakedMesh.material.map) {
      bakedMesh.material.map.anisotropy = 8;
    }

    this.scene.add(this.model);
  }

  setSmoke() {
    this.smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
    this.smokeGeometry.translate(0, 0.5, 0);
    this.smokeGeometry.scale(1.5, 6, 1.5);

    // ensures perlin noise texture rotates
    this.smokeTexture.wrapS = THREE.RepeatWrapping;
    this.smokeTexture.wrapT = THREE.RepeatWrapping;

    this.material = new THREE.ShaderMaterial({
      wireframe: false,
      vertexShader: coffeeVertex,
      fragmentShader: coffeeFragment,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPerlinTexture: new THREE.Uniform(this.smokeTexture),
        uTime: new THREE.Uniform(0),
        uMousePos: new THREE.Uniform(this.mousePos),
      },
    });

    this.smoke = new THREE.Mesh(this.smokeGeometry, this.material);

    this.smoke.position.y = 1.83;
    this.scene.add(this.smoke);
  }

  setDebug() {}

  update(time) {
    if (time && this.material) {
      this.material.uniforms.uTime.value = time.elapsedTime * 0.02;
    }
  }
}
