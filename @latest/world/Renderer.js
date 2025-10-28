import * as THREE from 'three';
export class Renderer {
  constructor({ canvas, sizes, scene, camera }) {
    this.canvas = canvas;
    this.sizes = sizes;
    (this.scene = scene), (this.camera = camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.toneMapping = THREE.CineonToneMapping;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }
}
