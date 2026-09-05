/**
 * AudioSource — loads a music file into a three Audio, taps it with an
 * analyser, and exposes a smoothed 0–1 `level` for scenes to drive visuals
 * with, plus named triggers that fire when a frequency band crosses a
 * threshold. Each trigger can carry its own analysis EQ to duck frequencies
 * bleeding into its band, and every one of its numbers is tunable live from the
 * debug panel. Experiences opt in through BaseExperience's audioOptions() hook.
 */
import EventEmitter from "./EventEmitter";
import { AudioListener, Audio, AudioAnalyser, AudioLoader } from "three";
import { AudioSpectrumDebug } from "./AudioSpectrumDebug";
import {
  normalizeLevel,
  smoothLevel,
  binRangeForHz,
  averageBand,
  buildBinGains,
  createTriggerState,
  nextTriggerState,
} from "./audioHelpers";

const TRIGGER_COLOURS = ["#ff4b4b", "#3ddc84", "#4b9bff", "#ffd23d"];

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
    debug,
  }) {
    super();
    this.canvas = canvas;
    this.smoothing = smoothing;
    this.level = 0;
    this.destroyed = false;
    this.debug = debug;

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
      Object.entries(triggers).map(([name, options], index) => [
        name,
        {
          eq: [],
          colour: TRIGGER_COLOURS[index % TRIGGER_COLOURS.length],
          ...options,
          ...createTriggerState(),
          // materialised rather than left to nextTriggerState's defaults so the
          // debug panel has real numbers to bind sliders to
          holdMs: options.holdMs ?? 0,
          releaseThreshold: options.releaseThreshold ?? options.threshold * 0.7,
          level: 0,
          fired: false,
          fireCount: 0,
        },
      ]),
    );

    Object.values(this.triggers).forEach((trigger) =>
      this.rebuildTriggerGains(trigger),
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

    this.setDebug();
  }

  rebuildTriggerGains(trigger) {
    const { sampleRate } = this.listener.context;
    trigger.gains = buildBinGains(
      trigger.eq,
      sampleRate,
      this.analyser.analyser.frequencyBinCount,
    );
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
    this.spectrumDebug?.draw(data, this.listener.context.sampleRate);
  }

  updateTriggers(data, elapsedTime) {
    const { sampleRate } = this.listener.context;

    Object.values(this.triggers).forEach((trigger) => {
      const { start, end } = binRangeForHz(trigger.band, sampleRate, data.length);
      trigger.level = normalizeLevel(
        averageBand(data, start, end, trigger.gains),
      );

      const { armed, lastFiredAt, fired } = nextTriggerState(
        trigger,
        trigger.level,
        trigger,
        elapsedTime,
      );

      trigger.armed = armed;
      trigger.lastFiredAt = lastFiredAt;
      trigger.fired = fired;
      if (fired) trigger.fireCount++;
    });
  }

  setDebug() {
    if (!this.debug?.active) return;

    this.debugFolder = this.debug.ui.addFolder("Audio");

    this.debugFolder
      .add(this.sound, "isPlaying")
      .name("Playing")
      .listen()
      .disable();

    this.debugFolder
      .add(this, "level", 0, 1)
      .name("Overall Level")
      .listen()
      .disable();

    this.debugFolder
      .add({ volume: this.sound.getVolume() }, "volume", 0, 1, 0.01)
      .name("Volume")
      .onChange((value) => this.sound.setVolume(value));

    this.spectrumDebug = new AudioSpectrumDebug(this.debugFolder, this);

    Object.entries(this.triggers).forEach(([name, trigger]) =>
      this.setTriggerDebug(name, trigger),
    );
  }

  setTriggerDebug(name, trigger) {
    const folder = this.debugFolder.addFolder(`Trigger: ${name}`);
    const nyquist = this.listener.context.sampleRate / 2;

    folder.add(trigger, "level", 0, 1).name("Level").listen().disable();
    folder.add(trigger, "fireCount").name("Fires").listen().disable();

    const band = { low: trigger.band[0], high: trigger.band[1] };
    folder
      .add(band, "low", 0, nyquist, 10)
      .name("Band Low (Hz)")
      .onChange((value) => {
        trigger.band = [value, band.high];
      });
    folder
      .add(band, "high", 0, nyquist, 10)
      .name("Band High (Hz)")
      .onChange((value) => {
        trigger.band = [band.low, value];
      });

    folder.add(trigger, "threshold", 0, 1, 0.01).name("Threshold");
    folder
      .add(trigger, "releaseThreshold", 0, 1, 0.01)
      .name("Release");
    folder.add(trigger, "holdMs", 0, 1000, 10).name("Hold (ms)");

    trigger.eq.forEach((eqBand) => {
      folder
        .add(eqBand, "gain", 0, 2, 0.05)
        .name(`EQ ${eqBand.band[0]}-${eqBand.band[1]}Hz`)
        .onChange(() => this.rebuildTriggerGains(trigger));
    });
  }

  destroy() {
    this.destroyed = true;
    this.stopListeningForGesture();

    this.spectrumDebug?.destroy();
    this.debugFolder?.destroy();

    if (this.sound.isPlaying) this.sound.stop();
    this.sound.disconnect();
    this.analyser.analyser.disconnect();
    this.listener.gain.disconnect();
    this.listener.removeFromParent();
  }
}
