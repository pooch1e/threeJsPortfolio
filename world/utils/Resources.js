import EventEmitter from './EventEmitter.js';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;

    // !! Need to add Draco config and loader here

    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;

    // Setup
    this.setLoaders();

    this.startLoading();
  }

  setLoaders() {
    this.loaders = {};

    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loaders.dracoLoader = new DRACOLoader();
  }

  startLoading() {
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.loaders.gltfLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file);
          },
          undefined,
          (error) => {
            console.error(`Error loading ${source.name}:`, error);
            this.sourceLoaded(source, null);
          }
        );
      } else if (source.type === 'texture') {
        this.loaders.textureLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file);
          },
          undefined,
          (error) => {
            console.error(`Error loading ${source.name}:`, error);
            this.sourceLoaded(source, null);
          }
        );
      } else if (source.type === 'cubeTexture') {
        this.loaders.cubeTextureLoader.load(
          source.path,
          (file) => {
            this.sourceLoaded(source, file);
          },
          undefined,
          (error) => {
            console.error(`Error loading ${source.name}:`, error);
            this.sourceLoaded(source, null);
          }
        );
      }
    }
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file;
    this.loaded++;

    if (this.loaded === this.toLoad) {
      console.log('All resources loaded!');
      this.trigger('ready');
    }
  }
}
