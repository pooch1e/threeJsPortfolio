import * as THREE from 'three';
import waterVertexShader from './shaders/water/vertex.glsl';
import waterFragmentShader from './shaders/water/fragment.glsl';

export default class Waves {
  constructor(world) {
    this.world = world;
    this.scene = this.world.scene;
    this.debug = this.world.shaderExperience.debug;

    // Colours for debug
    this.debugObject = {};

    // Colours
    this.debugObject.depthColor = '#186691'; // when wave is lowest
    this.debugObject.surfaceColor = '#9bd8ff'; // when wave is highest/tallest

    this.setShader();
    this.setDebug();
  }

  setShader() {
    this.geometry = new THREE.PlaneGeometry(2, 2, 512, 512);
    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uBigWavesElevation: { value: 0.2 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uTime: { value: 0.0 },
        uWaveSpeed: { value: 0.75 },
        uDepthColour: { value: new THREE.Color(this.debugObject.depthColor) },
        uSurfaceColour: {
          value: new THREE.Color(this.debugObject.surfaceColor),
        },
        uColorOffset: { value: 0.25 },
        uColorMultiplier: { value: 2 },
        
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);

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
}
