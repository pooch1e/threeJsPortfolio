/**
 * AudioSource — loads a music file into a three Audio, taps it with an
 * analyser, and exposes a smoothed 0–1 `level` for scenes to drive visuals
 * with. Experiences opt in through BaseExperience's audioOptions() hook.
 */
import EventEmitter from "./EventEmitter";
import { AudioListener, Audio, AudioAnalyser, AudioLoader } from "three";
import { normalizeLevel, smoothLevel } from "./audioHelpers";

export class AudioSource extends EventEmitter {
  constructor({
    camera,
    canvas,
    path,
    loop = true,
    volume = 0.5,
    fftSize = 64,
    smoothing = 0.15,
    autoplay = true,
  }) {
    super();
    this.canvas = canvas;
    this.smoothing = smoothing;
    this.level = 0;

    this.listener = new AudioListener();
    camera.add(this.listener);

    this.sound = new Audio(this.listener);
    this.sound.setLoop(loop);
    this.sound.setVolume(volume);

    this.analyser = new AudioAnalyser(this.sound, fftSize);

    new AudioLoader().load(path, (buffer) => {
      this.sound.setBuffer(buffer);
      this.trigger("ready");
      if (autoplay) this.play();
    });

    if (autoplay) this.listenForGesture();
  }

  // Browsers start the AudioContext suspended and only let a user gesture
  // resume it, so playback is attempted from both the gesture and the load
  // callback — whichever lands last is the one that actually starts it.
  listenForGesture() {
    this.gestureHandler = () => this.play();
    this.canvas?.addEventListener("pointerdown", this.gestureHandler);
    window.addEventListener("keydown", this.gestureHandler);
  }

  stopListeningForGesture() {
    if (!this.gestureHandler) return;
    this.canvas?.removeEventListener("pointerdown", this.gestureHandler);
    window.removeEventListener("keydown", this.gestureHandler);
    this.gestureHandler = null;
  }

  async play() {
    const { context } = this.listener;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return;
    if (!this.sound.buffer || this.sound.isPlaying) return;

    this.sound.play();
    this.stopListeningForGesture();
  }

  pause() {
    if (this.sound.isPlaying) this.sound.pause();
  }

  update() {
    this.level = smoothLevel(
      this.level,
      normalizeLevel(this.analyser.getAverageFrequency()),
      this.smoothing,
    );
  }

  destroy() {
    this.stopListeningForGesture();
    if (this.sound.isPlaying) this.sound.stop();
    this.sound.disconnect();
    this.listener.removeFromParent();
  }
}
