/**
 * WorldTransform — debug-only TransformControls gizmo. Attaches to an object,
 * switches mode with g/r/s, and suspends orbit controls while dragging.
 */
import { TransformControls } from "three/addons/controls/TransformControls.js";

export class WorldTransform {
  constructor({ canvas, camera, orbitControls, scene }) {
    this.scene = scene;
    this.orbitControls = orbitControls;
    this.controls = new TransformControls(camera, canvas);
    this.helper = this.controls.getHelper();
    this.scene.add(this.helper);

    this.controls.addEventListener("dragging-changed", this.onDraggingChanged);
    window.addEventListener("keydown", this.onKeyDown);
  }

  onDraggingChanged = (event) => {
    if (this.orbitControls) this.orbitControls.enabled = !event.value;
  };

  onKeyDown = (event) => {
    if (event.target instanceof HTMLInputElement) return;
    const modes = { g: "translate", r: "rotate", s: "scale" };
    const mode = modes[event.key];
    if (mode) this.controls.setMode(mode);
  };

  attach(object) {
    this.controls.attach(object);
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    this.controls.detach();
    this.scene.remove(this.helper);
    this.controls.dispose();
  }
}
