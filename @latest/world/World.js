import * as THREE from 'three';
import { Sizes } from './utils/SIzes';


export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.sizes = new Sizes();
  }
}
