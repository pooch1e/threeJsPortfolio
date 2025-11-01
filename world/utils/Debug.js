import {GUI} from 'lil-gui'
export class Debug {
  constructor() {
    this.active = window.location.hash === '#debug'

    if (this.active) {
      this.ui = new GUI()
    }
  }
}