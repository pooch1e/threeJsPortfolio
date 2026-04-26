import EventEmitter from './EventEmitter.js';
import { TextureLoader, CubeTextureLoader } from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
export class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;

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
    this.loaders.textureLoader = new TextureLoader();
    this.loaders.hdrLoader = new RGBELoader();
    this.loaders.cubeTextureLoader = new CubeTextureLoader();
    this.loaders.dracoLoader = new DRACOLoader();
    this.loaders.dracoLoader.setDecoderPath('/static/draco/');
    this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
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
      } else if (source.type === 'hdrTexture') {
        this.loaders.hdrLoader.load(
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
      } else if (source.type === 'textureArray') {
        const textures = [];
        let loadedCount = 0;
        const totalTextures = source.path.length;

        source.path.forEach((path, index) => {
          this.loaders.textureLoader.load(
            path,
            (texture) => {
              textures[index] = texture;
              loadedCount++;
              if (loadedCount === totalTextures) {
                this.sourceLoaded(source, textures);
              }
            },
            undefined,
            (error) => {
              console.error(`Error loading ${source.name}[${index}]:`, error);
              textures[index] = null;
              loadedCount++;
              if (loadedCount === totalTextures) {
                this.sourceLoaded(source, textures);
              }
            }
          );
        });
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
