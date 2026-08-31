import { EventEmitter } from './EventEmitter'
import { AudioListener, Audio, AudioAnalyser, AudioLoader } from 'three';
import { normalizeLevel, smoothLevel } from './audioHelpers';

export class AudioSource extends EventEmitter {
  constructor({camera, path, loop = true, volume = 0.5, fftSize = 64 }) {
    super();
    this.listener = new AudioListener();
    camera.add(this.listener);

    this.sound = new Audio(this.listener);
    this.sound.setLoop(loop);
    this.sound.setVolume(volume);

    this.analyser = new AudioAnalyser(this.sound, fftSize);
       this.level = 0;

       new AudioLoader().load(path, (buffer) => {
         this.sound.setBuffer(buffer);
         this.trigger('ready');
       });
  }

  async play() {
      if (this.listener.context.state === 'suspended') {
        await this.listener.context.resume();   // must originate from a gesture
      }
      if (this.sound.buffer && !this.sound.isPlaying) this.sound.play();
    }

    update() {
      this.level = smoothLevel(this.level, normalizeLevel(this.analyser.getAverageFrequency()), 0.15);
    }

    destroy() {
      if (this.sound.isPlaying) this.sound.stop();
      this.sound.disconnect();
      this.listener.removeFromParent();
    }
}
