import * as THREE from 'three'
import { Portal } from './Portal'
import { Resources } from '../utils/Resources'
import { sources } from '../sources/sources'
export class World {
  constructor(portalExperience) {
    this.portalExperience = portalExperience
    this.scene = this.portalExperience.scene
    this.resources = new Resources(sources)

        this.resources.on('ready', () => {
      this.portal = new Portal(this);
    });
  }

  update(time) {
    if (time) {
      
    }
  }
}