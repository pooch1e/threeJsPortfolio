import {
  RectAreaLight,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  ShaderMaterial,
} from "three";

import firefliesVertexShader from "./shaders/vertex.glsl";
import firefliesFragmentShader from "./shaders/fragment.glsl";
export class Portal {
  constructor(world) {
    this.world = world;

    this.scene = world.scene;
    this.debug = this.world.portalExperience.debug;
    this.resources = world.resources;
    this.environment = this.world.environment;
    this.debug = this.world.portalExperience.debug;
    this.renderer = this.world.portalExperience.renderer.renderer;
    console.log(this.renderer);

    this.portalModel = this.resources.items.portalModel;
    this.portalMap = this.resources.items.portalMap;

    this.debugObject = {
      clearColor: "#43351e",
      fireflyCount: 30,
      fireflySize: 0.1,
    };

    this.renderer.setClearColor(this.debugObject.clearColor);

    this.addLights();
    this.setModel();
    this.setFlies();
    this.setDebug();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("Portal Blend");
      this.debugFolder.addColor(this.debugObject, "clearColor").onChange(() => {
        this.renderer.setClearColor(this.debugObject.clearColor);
      });
      this.debugFolder
        .add(this.firefliesMaterial.uniforms.uSize, "value")
        .min(0)
        .max(500)
        .step(1)
        .name("firefliesSize");
    }
  }

  addLights() {
    this.pointLight = new RectAreaLight("white", 5);
    this.pointLight.position.y = 10;
    this.pointLight.lookAt(0, 0, 0);
    this.scene.add(this.pointLight);
  }

  setModel() {
    // this.portalModel.scene.traverse((child) => {
    //   if (child.isMesh) {
    //     child.material = new THREE.MeshBasicMaterial({
    //       map: this.portalMap
    //     });
    //   }
    // });
    // texture looks SHIT - use built in for now
    this.portalModel.scene.rotation.y = -90;
    this.portalModel.scene.position.z = 2;
    this.scene.add(this.portalModel.scene);
  }

  setFlies() {
    this.geometry = new BufferGeometry();
    const positions = new Float32Array(this.debugObject.fireflyCount * 3);
    // Centered on X and Y, above model on Z
    const width = 4;
    const height = 4;
    const zOffset = 1;
    for (let i = 0; i < this.debugObject.fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width; // centered X
      positions[i * 3 + 1] = (Math.random() - 0.5) * height; // centered Y
      positions[i * 3 + 2] = zOffset + Math.random() * 2; // above model on Z
    }

    this.geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.firefliesMaterial = new ShaderMaterial({
      size: 0.1,
      sizeAttenuation: true,
      vertexShader: firefliesVertexShader,
      fragmentShader: firefliesFragmentShader,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 },
      },
    });
    this.fireflyPoints = new Points(this.geometry, this.firefliesMaterial);
    this.fireflyPoints.position.y = 2;
    this.scene.add(this.fireflyPoints);
  }

  update(time) {
    if (time) {
    }
  }
}
