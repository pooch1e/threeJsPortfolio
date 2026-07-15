/**
 * Renders one flower's particles by reading a shared FlowerSimulation's
 * GPGPU output texture. Position and color palette are per-instance; the
 * simulation itself is not — see FlowerSimulation.js for why sharing it
 * across flowers is safe and how the vertex shader turns the shared
 * uColor/uColorA/uColorB uniforms into per-part shading.
 */
import { Uniform, ShaderMaterial, Vector2, Points, Color } from "three";
import vertexParticles from "./shaders/gppuFlower/vertex.glsl";
import fragmentParticles from "./shaders/gppuFlower/fragment.glsl";

export default class FlowerPoints {
  constructor(
    world,
    simulation,
    {
      position = { x: 0, y: -1, z: 1 },
      colorBase = "#D1D3D9",
      colorA = "#A6C8F2",
      colorB = "#F2A6C8",
    } = {},
  ) {
    this.world = world;
    this.scene = world.scene;
    this.sizes = world.flowerExperience.sizes;
    this.simulation = simulation;

    this.material = new ShaderMaterial({
      vertexShader: vertexParticles,
      fragmentShader: fragmentParticles,
      uniforms: {
        uSize: new Uniform(0.005),
        uParticlesTexture: new Uniform(simulation.getTexture()),
        uResolution: new Uniform(
          new Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio,
          ),
        ),
        uColor: new Uniform(new Color(colorBase)),
        uColorA: new Uniform(new Color(colorA)),
        uColorB: new Uniform(new Color(colorB)),
      },
    });

    this.points = new Points(simulation.getGeometry(), this.material);
    this.points.position.set(position.x, position.y, position.z);
    this.scene.add(this.points);
  }

  update() {
    this.material.uniforms.uParticlesTexture.value = this.simulation.getTexture();
  }

  destroy() {
    this.scene.remove(this.points);
    this.material.dispose();
  }
}
