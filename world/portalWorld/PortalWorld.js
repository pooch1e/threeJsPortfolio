import * as THREE from 'three'
import { Portal } from './Portal'
export class PortalWorld {
  constructor(portalExperience) {
    this.portalExperience = portalExperience
    this.scene = this.portalExperience.scene
    this.resources = this.portalExperience.resources

    this.portal = new Portal(this)
    console.log(this.portal, 'checking portal instance')
  }
}