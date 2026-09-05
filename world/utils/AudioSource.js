/**
 * AudioSource — loads a music file into a three Audio, taps it with an
 * analyser, and exposes a smoothed 0–1 `level` for scenes to drive visuals
 * with, plus named triggers that fire when a frequency band crosses a
 * threshold. Experiences opt in through BaseExperience's audioOptions() hook.
 */
import EventEmitter from "./EventEmitter";
import { AudioListener, Audio, AudioAnalyser, AudioLoader } from "three";
import {
  normalizeLevel,
  smoothLevel,
  binRangeForHz,
  averageBand,
  createTriggerState,
  nextTriggerState,
} from "./audioHelpers";

export class AudioSource extends EventEmitter {
  constructor({
    camera,
    canvas,
    path,
    loop = true,
    volume = 0.5,
    fftSize = 512,
    smoothing = 0.15,
    smoothingTimeConstant = 0.2,
    triggers = {},
    autoplay = true,
  }) {
    super();
    this.canvas = canvas;
    this.smoothing = smoothing;
    this.level = 0;
    this.destroyed = false;

    this.listener = new AudioListener();
    camera.add(this.listener);

    this.sound = new Audio(this.listener);
    this.sound.setLoop(loop);
    this.sound.setVolume(volume);

    this.analyser = new AudioAnalyser(this.sound, fftSize);

    // three leaves this at the AnalyserNode default of 0.8, which lowpasses
    // the spectrum hard enough to flatten the transients triggers fire on
    this.analyser.analyser.smoothingTimeConstant = smoothingTimeConstant;

    this.triggers = Object.fromEntries(
      Object.entries(triggers).map(([name, options]) => [
        name,
        { ...options, ...createTriggerState(), level: 0, fired: false },
      ]),
    );

    new AudioLoader().load(
      path,
      (buffer) => {
        if (this.destroyed) return;

        this.sound.setBuffer(buffer);
        this.trigger("ready");
        if (autoplay) this.requestPlay();
      },
      undefined,
      (error) => {
        if (this.destroyed) return;
        this.trigger("error", [error]);
      },
    );

    if (autoplay) this.listenForGesture();
  }

  listenForGesture() {
    this.gestureHandler = () => this.requestPlay();
    this.canvas?.addEventListener("pointerdown", this.gestureHandler);
    window.addEventListener("keydown", this.gestureHandler);
  }

  stopListeningForGesture() {
    if (!this.gestureHandler) return;
    this.canvas?.removeEventListener("pointerdown", this.gestureHandler);
    window.removeEventListener("keydown", this.gestureHandler);
    this.gestureHandler = null;
  }

  requestPlay() {
    this.play().catch(() => {});
  }

  async play() {
    const { context } = this.listener;
    if (context.state === "suspended") await context.resume();
    if (this.destroyed || context.state !== "running") return;
    if (!this.sound.buffer || this.sound.isPlaying) return;

    this.sound.play();
    this.stopListeningForGesture();
  }

  get isPlaying() {
    return this.sound.isPlaying;
  }

  pause() {
    if (this.sound.isPlaying) this.sound.pause();
  }

  update(time) {
    const data = this.analyser.getFrequencyData();

    this.level = smoothLevel(
      this.level,
      normalizeLevel(averageBand(data, 0, data.length)),
      this.smoothing,
    );

    this.updateTriggers(data, time.elapsedTime);
  }

  updateTriggers(data, elapsedTime) {
    const { sampleRate } = this.listener.context;

    Object.values(this.triggers).forEach((trigger) => {
      const { start, end } = binRangeForHz(trigger.band, sampleRate, data.length);
      trigger.level = normalizeLevel(averageBand(data, start, end));

      const { armed, lastFiredAt, fired } = nextTriggerState(
        trigger,
        trigger.level,
        trigger,
        elapsedTime,
      );

      trigger.armed = armed;
      trigger.lastFiredAt = lastFiredAt;
      trigger.fired = fired;
    });
  }

  destroy() {
    this.destroyed = true;
    this.stopListeningForGesture();

    if (this.sound.isPlaying) this.sound.stop();
    this.sound.disconnect();
    this.analyser.analyser.disconnect();
    this.listener.gain.disconnect();
    this.listener.removeFromParent();
  }
}
