import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
export class Ascii {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.debug = world.asciiExperience.debug;

    this.setDebug();
    this.setPlaneGeometry();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Ascii Experience");
    }
  }

  setPlaneGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(10, 10,100);
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    console.log(this.planeMesh);

    this.scene.add(this.planeMesh);
  }

  update(time) {
    if (time) {
    }
  }

  destroy() {}
}
