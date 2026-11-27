import { WorldTransform } from "../../world/utils/WorldTransform";
import * as THREE from 'three';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from "three/webgpu";
import { uv, float, smoothstep, color, Fn, vec3, time, step, vec4, texture } from 'three/tsl';


export class RbiWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;

    // get renderer for inspector debug ui
    this.inspector = this.experience.renderer.renderer.inspector;
    this.earthParams = this.inspector.createParameters('Earth');

    
    this.transformControls = new WorldTransform({ canvas: experience.canvas, camera: experience.camera.perspectiveCamera, orbitControls: experience.camera.controls, scene: this.scene })

    this.setLights()
    this.setCrossHair()
    this.setEarth()

    this.setScanDataLines()

  }

  setEarth() {
    this.earthDayTexture = this.resources.items.earthTextures[0]
    this.uvDebugTexture = this.resources.items.customUvChecker;
    this.earthGeometry = new THREE.SphereGeometry(18, 64, 64)
    this.earthMaterial = new MeshBasicNodeMaterial({ transparent: true });

    // sample earthTextures
    this.earthMaterial.colorNode = texture(this.uvDebugTexture, uv()); // texture returns a vec4, colornode requires vec3
    

    // this.earthParams.add(this.earthMaterial, 'opacity', 0, 1, 0.01)
    
    // earthMaterial.outputNode = earthDayTexture
    this.earthMesh = new THREE.Mesh(this.earthGeometry, this.earthMaterial)

    // comment in to overide animation and use controls
    // this.transformControls.attach(this.mesh)
    // this.scene.add(this.transformControls.helper)
    this.scene.add(this.earthMesh)
  }

  setCrossHair() {

    this.crossHairGroup = new THREE.Group()
    this.planeGeometry = new THREE.PlaneGeometry(10, 10, 10)
    this.planeMaterial = new MeshBasicNodeMaterial({transparent: true});

    const boundingBoxBorder = (thickness = 0.0015, smoothness = 0.002) => {
      const coord = uv();
      const t = float(thickness);
      const s = float(smoothness);
    
      // Distance to the closest edge (0.0 or 1.0)
      const distX = coord.x.min(float(1.0).sub(coord.x));
      const distY = coord.y.min(float(1.0).sub(coord.y));
      const minDist = distX.min(distY);
    
      // Smoothly transition from 1.0 (border) to 0.0 (transparent interior)
      return float(1.0).sub(smoothstep(t, t.add(s), minDist));
    };

    this.planeMaterial.colorNode = color('red');
    this.planeMaterial.opacityNode = boundingBoxBorder(0.0015, 0.002);
    
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.planeMesh.position.z = 20

    this.crossHairGroup.add(this.planeMesh)

    // Lines through the plane
    this.linesYGeometry = new THREE.PlaneGeometry(0.1, 20, 1);
    this.linesMaterial = new MeshStandardNodeMaterial();
    this.linesMaterial.colorNode = color('red')

    
    this.lineMesh = new THREE.Mesh(this.linesYGeometry, this.linesMaterial)

    this.lineMesh.position.z = 20

    this.crossHairGroup.add(this.lineMesh)

    // Lines through the plane
    this.linesXGeometry = new THREE.PlaneGeometry(20, 0.1, 1);

    
    this.lineMesh = new THREE.Mesh(this.linesXGeometry, this.linesMaterial)

    this.lineMesh.position.z = 20

    this.crossHairGroup.add(this.lineMesh)

    this.scene.add(this.crossHairGroup)

    
  }

  setScanDataLines() {
    const scanLineGeometry = new THREE.PlaneGeometry(1, 0.1, 10);
    const scanLineMaterial = new MeshBasicNodeMaterial({transparent: true});

    const speed = float(0.5);
    
    const lines = uv().x.mul(10.0).sub(time.mul(speed)).fract().toVar('scanLines').toInspector('scan line')

    const bar = step(0.9, lines).toInspector('bars')

    scanLineMaterial.opacityNode = vec4(bar)

    scanLineMaterial.colorNode = color('red')
    
    const mesh = new THREE.Mesh(scanLineGeometry, scanLineMaterial);
    mesh.position.z = 25;
    mesh.position.y = 0.05
    mesh.position.x = 4
    this.scene.add(mesh)
    
  }

  setLights() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(2, 0.75, -1).normalize().multiplyScalar(10);
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.near = 0.01;
    this.directionalLight.shadow.camera.far = 20;
    this.directionalLight.shadow.camera.radius = 3;
    this.directionalLight.shadow.normalBias = 0.1;
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(0x859dff, 1)
    this.scene.add(this.ambientLight);
  }
  update(time) {
    if (time.elapsedTime) {
      this.earthMesh.rotation.x = (time.elapsedTime * 0.0002)
      this.earthMesh.rotation.y = time.elapsedTime * 0.0002
    }
  }

  destroy() {
    if (this.transformControls) {
      this.transformControls.dispose()
    }
  }
}
