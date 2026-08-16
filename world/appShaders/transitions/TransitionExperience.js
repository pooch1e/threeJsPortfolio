/**
 * TransitionExperience — persistent fullscreen-quad renderer that plays a
 * pixelated grid-dissolve effect (see fragment.glsl) driven by GSAP tweens
 * on the uProgress uniform. Mounted once for the app's lifetime by
 * TransitionOverlay, not per-route.
 */
import { WebGLRenderer, Scene, OrthographicCamera, ShaderMaterial, PlaneGeometry, Mesh, Color } from "three";
import transitionFragmentShader from './fragment.glsl'
import transitionVertexShader from './vertex.glsl'
export class TransitionExperience {
  constructor(canvas) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true })
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene = new Scene()

    this.geometry = new PlaneGeometry(2, 2);
    this.material = new ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uGridSize: { value: 24.0 },
        uColor: { value: new Color("#0a0a0a") },
      },
      fragmentShader: transitionFragmentShader,
      vertexShader: transitionVertexShader,
      transparent: true,
    })

    this.scene.add(new Mesh(this.geometry, this.material))

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop(() => this.render());
  }

  resize() {
    const { innerWidth, innerHeight } = window;
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setProgress(progressFloat) {
    this.material.uniforms.uProgress.value = progressFloat;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
