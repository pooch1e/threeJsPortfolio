import EventEmitter from './EventEmitter.js';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;
    console.log(this.sources);

    // !! Need to add Draco config and loader here

    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;

    // Setup
    this.setLoaders();
  }

  setLoaders() {
    this.loaders = {};

    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loaders.dracoLoader = new DRACOLoader();
  }
}
