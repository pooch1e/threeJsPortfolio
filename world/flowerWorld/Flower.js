import { Uniform, Mesh, PlaneGeometry, MeshBasicMaterial, BufferGeometry, BufferAttribute, ShaderMaterial, Vector2, Points } from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

export default class FlowerField {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.resources = world.resources;
    this.debug = this.world.flowerExperience.debug;
    this.sizes = world.flowerExperience.sizes;
    this.renderer = world.flowerExperience.renderer.renderer;

    if (this.resources) {
      this.model = this.resources.items.flowerModel
    }
  }
}