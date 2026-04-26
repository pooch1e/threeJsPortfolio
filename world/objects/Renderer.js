import { WebGLRenderer, CineonToneMapping, PCFSoftShadowMap } from 'three';
export class Renderer {
  constructor({ canvas, sizes, scene, camera }) {
    this.canvas = canvas;
    this.sizes = sizes;
    (this.scene = scene), (this.camera = camera);
    this.usePostProcessing = false;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.toneMapping = CineonToneMapping;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  resize() {
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    // Skip rendering if post-processing is handling it
    if (!this.usePostProcessing) {
      this.renderer.render(this.scene, this.camera.perspectiveCamera);
    }
  }
}
