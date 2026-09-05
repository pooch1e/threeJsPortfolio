/**
 * AudioSpectrumDebug — a canvas dropped into the lil-gui panel that draws the
 * live analyser spectrum with each trigger's band shaded over it, its threshold
 * as a horizontal line and its current level as a bar. Tuning a band by ear
 * alone means guessing where a sound sits; this shows it.
 */
const WIDTH = 260;
const HEIGHT = 110;

export class AudioSpectrumDebug {
  constructor(folder, audio) {
    this.audio = audio;

    this.canvas = document.createElement("canvas");
    this.canvas.width = WIDTH * window.devicePixelRatio;
    this.canvas.height = HEIGHT * window.devicePixelRatio;
    this.canvas.style.width = "100%";
    this.canvas.style.height = `${HEIGHT}px`;
    this.canvas.style.display = "block";

    this.context = this.canvas.getContext("2d");
    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);

    folder.$children.appendChild(this.canvas);
  }

  draw(data, sampleRate) {
    const ctx = this.context;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.drawBins(data);
    this.drawGridLabels(sampleRate);

    Object.values(this.audio.triggers).forEach((trigger) =>
      this.drawTrigger(trigger, sampleRate),
    );
  }

  drawBins(data) {
    const ctx = this.context;
    const barWidth = WIDTH / data.length;

    ctx.fillStyle = "#6f6f6f";
    for (let i = 0; i < data.length; i++) {
      const height = (data[i] / 255) * HEIGHT;
      ctx.fillRect(i * barWidth, HEIGHT - height, barWidth, height);
    }
  }

  drawGridLabels(sampleRate) {
    const ctx = this.context;
    const nyquist = sampleRate / 2;

    ctx.fillStyle = "#8a8a8a";
    ctx.font = "9px monospace";
    [0.25, 0.5, 0.75].forEach((fraction) => {
      const x = fraction * WIDTH;
      ctx.fillRect(x, 0, 1, HEIGHT);
      ctx.fillText(`${Math.round((nyquist * fraction) / 1000)}k`, x + 3, 10);
    });
  }

  drawTrigger(trigger, sampleRate) {
    const ctx = this.context;
    const nyquist = sampleRate / 2;
    const toX = (hz) => Math.min(hz / nyquist, 1) * WIDTH;

    const [lowHz, highHz] = trigger.band;
    const left = toX(lowHz);
    const width = Math.max(toX(highHz) - left, 1);

    ctx.globalAlpha = trigger.fired ? 0.5 : 0.12;
    ctx.fillStyle = trigger.colour;
    ctx.fillRect(left, 0, width, HEIGHT);
    ctx.globalAlpha = 1;

    ctx.fillRect(left, HEIGHT - trigger.threshold * HEIGHT, width, 1);
    ctx.fillRect(left, HEIGHT - trigger.level * HEIGHT, width, 2);
  }

  destroy() {
    this.canvas.remove();
  }
}
