import { WebGLRenderer, Scene, OrthographicCamera, ShaderMaterial, Uniform, PlaneGeometry, Mesh } from "three";
import transitionFragmentShader from './fragment.glsl'
import transitionVertexShader from './vertex.glsl'
export class TransitionExperience {
  constructor(canvas) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true })
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene = new Scene()

    this.material = new ShaderMaterial({
      uniforms: {
        uProgress: new Uniform({ value: 0 }),
        uGridSize: new Uniform({value: 24.0})
      },
      fragmentShader: transitionFragmentShader,
      vertexShader: transitionVertexShader,
      transparent: true,
    })


    const geometry = new PlaneGeometry(2, 2);
    this.scene.add(new Mesh(geometry, this.material))

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
    this.material.uniforms.uProgress = progressFloat;
  }

render() {
  this.renderer.render(this.scene, this.camera);
}

destroy() {
  this.renderer.setAnimationLoop(null);
  this.renderer.dispose();
}
}
