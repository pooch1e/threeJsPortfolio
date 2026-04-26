import { PlaneGeometry, ShaderMaterial, Uniform, Vector2, Color, Mesh } from 'three';
import waterVertexShader from './shaders/water/vertex.glsl';
import waterFragmentShader from './shaders/water/fragment.glsl';

export default class Waves {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;
    this.helper = this.world.helpers;

    // Colours for debug
    this.debugObject = {};

    // Colours
    this.debugObject.depthColor = '#ff4000'; // when wave is lowest
    this.debugObject.surfaceColor = '#151c37'; // when wave is highest/tallest

    this.setShader();
    this.setDebug();

    // Set Helper
    // this.helper.setAxisHelper();
  }

  setShader() {
    this.geometry = new PlaneGeometry(2, 2, 512, 512);
    this.shaderMaterial = new ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uBigWavesElevation: new Uniform(0.2),
        uBigWavesFrequency: new Uniform(new Vector2(4, 1.5)),
        uTime: new Uniform(0),
        uWaveSpeed: new Uniform(0.75),
        uBigWavesSpeed: new Uniform(0.75),

        // Small waves uniforms
        uSmallIterations: new Uniform(4.0),
        uSmallWavesElevation: new Uniform(0.15),
        uSmallWavesFrequency: new Uniform(3.0),
        uSmallWavesSpeed: new Uniform(0.2),

        uDepthColour: new Uniform(
          new Color(this.debugObject.depthColor)
        ),
        uSurfaceColour: new Uniform(
          new Color(this.debugObject.surfaceColor)
        ),

        uColorOffset: new Uniform(0.925),
        uColorMultiplier: new Uniform(1),
      },
    });

    this.geometry.deleteAttribute('normal')

    this.mesh = new Mesh(this.geometry, this.shaderMaterial);

    this.mesh.rotation.x = -Math.PI * 0.5;
    console.log(this.mesh.rotation.z);
    this.scene.add(this.mesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Waves GUI');

      this.debugFolder
        .add(this.shaderMaterial.uniforms.uBigWavesElevation, 'value')
        .min(0)
        .max(1)
        .step(0.001);

      this.debugFolder
        .add(this.shaderMaterial.uniforms.uBigWavesFrequency.value, 'x')
        .min(0)
        .max(10)
        .step(0.001)
        .name('uBigWavesFrequencyX');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uBigWavesFrequency.value, 'y')
        .min(0)
        .max(10)
        .step(0.001)
        .name('uBigWavesFrequencyY');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uWaveSpeed, 'value')
        .min(0)
        .max(4)
        .step(0.001)
        .name('uWave Speed');

      this.debugFolder.addColor(this.debugObject, 'depthColor').onChange(() => {
        this.shaderMaterial.uniforms.uDepthColour.value.set(
          this.debugObject.depthColor
        );
      });
      this.debugFolder
        .addColor(this.debugObject, 'surfaceColor')
        .onChange(() => {
          this.shaderMaterial.uniforms.uSurfaceColour.value.set(
            this.debugObject.surfaceColor
          );
        });
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uColorOffset, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('uColorOffset');
      this.debugFolder
        .add(this.shaderMaterial.uniforms.uColorMultiplier, 'value')
        .min(0)
        .max(10)
        .step(0.001)
        .name('uColorMultiplier');
    }
  }

  update(time) {
    if (time) {
      //scale down speed by * by 0.00
      this.shaderMaterial.uniforms.uTime.value = time.elapsedTime * 0.002;
    }
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.geometry?.dispose();
      this.shaderMaterial?.dispose();
    }
    if (this.debugFolder) {
      this.debugFolder.destroy();
    }
  }
}
