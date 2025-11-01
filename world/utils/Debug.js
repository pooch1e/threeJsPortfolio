import { GUI } from 'lil-gui';
export class Debug {
  constructor(enabled = false) {
    this.active = enabled;

    if (this.active) {
      this.ui = new GUI();
    }
  }
}
