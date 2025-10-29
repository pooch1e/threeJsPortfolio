import { EventEmitter } from './EventEmitter';
export class Resources extends EventEmitter {
  constructor(sources) {
    super();

    // Options
    this.sources = sources;
  }
}
