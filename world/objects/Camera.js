/**
 * Camera — the scene camera plus optional orbit controls. Builds a
 * PerspectiveCamera by default, or an OrthographicCamera when `type` says so,
 * and keeps whichever one it built projecting correctly across resizes.
 *
 * `perspectiveCamera` holds the camera whatever its type: every scene, the
 * Renderer and AudioSource read that property, so it keeps its name rather
 * than renaming the accessor across nine worlds.
 *
 * An orthographic camera is sized by `frustumHeight` in world units, with its
 * width derived from the viewport aspect — so a scene that needs world units
 * to map to a fixed number of screen pixels calls setFrustumHeight() on resize.
 */
import { PerspectiveCamera, OrthographicCamera } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class Camera {
  constructor({
    canvas,
    fov = 75,
    sizes,
    near = 0.1,
    far = 2000,
    controls = true,
    type = "perspective",
    frustumHeight = 10,
  }) {
    this.canvas = canvas;
    this.sizes = sizes;
    this.type = type;
    this.frustumHeight = frustumHeight;

    if (this.type === "orthographic") {
      const halfHeight = this.frustumHeight / 2;
      const halfWidth = halfHeight * sizes.aspect;

      this.perspectiveCamera = new OrthographicCamera(
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        near,
        far,
      );
      this.perspectiveCamera.position.set(0, 0, 5);
    } else {
      this.perspectiveCamera = new PerspectiveCamera(
        fov,
        sizes.aspect,
        near,
        far,
      );
      this.perspectiveCamera.position.set(0, 1, 5);
    }

    if (controls) {
      this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
    }
  }

  setFrustumHeight(frustumHeight) {
    this.frustumHeight = frustumHeight;
    this.resize();
  }

  resize() {
    if (this.type === "orthographic") {
      const halfHeight = this.frustumHeight / 2;
      const halfWidth = halfHeight * this.sizes.aspect;

      this.perspectiveCamera.left = -halfWidth;
      this.perspectiveCamera.right = halfWidth;
      this.perspectiveCamera.top = halfHeight;
      this.perspectiveCamera.bottom = -halfHeight;
    } else {
      this.perspectiveCamera.aspect = this.sizes.width / this.sizes.height;
    }

    this.perspectiveCamera.updateProjectionMatrix();
  }

  update() {
    if (this.controls) {
      this.controls.update();
    }
  }
}
