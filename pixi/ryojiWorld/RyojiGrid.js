import { Graphics, Text } from 'pixi.js';
import { Noise } from 'noisejs';
import { AudioInput } from '../utils/AudioInput';

const lerp = (a, b, t) => a + (b - a) * t;

export class RyojiGrid {
  constructor(world) {
    this.world = world;
    this.app = world.experience.app;
    this.stage = world.experience.renderer.stage;
    this.sizes = world.experience.sizes;

    // Audio (fftSize: 64 gives 32 frequency bins)
    this.audio = new AudioInput({ smoothing: 0.7, fftSize: 64 });
    this.audioStarted = false;

    // Grid configuration
    this.cols = 32;
    this.rows = 16;
    this.cellWidth = 0;
    this.cellHeight = 0;

    // State for each cell
    this.cells = [];
    this.lastBeatFrame = 0;
    this.globalFlash = 0;
    this.frameCount = 0;

    // Perlin noise instance (seeded randomly per session)
    this.noise = new Noise(Math.random());

    this.g = null;
    this.promptText = null;
    this._onClick = null;
    this._onKeyDown = null;
  }

  init() {
    this.app.renderer.background.color = 0x000000;

    // Single Graphics object, rebuilt each frame
    this.g = new Graphics();
    this.stage.addChild(this.g);

    // "CLICK TO START" prompt
    this.promptText = new Text({
      text: 'CLICK TO START',
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: 'monospace',
      },
    });
    this.promptText.anchor.set(0.5, 0.5);
    this.promptText.position.set(this.sizes.width / 2, this.sizes.height / 2);
    this.stage.addChild(this.promptText);

    this._calculateGrid();
    this._initCells();

    // Named handlers for clean removal in destroy()
    this._onClick = async () => {
      if (!this.audioStarted) {
        const success = await this.audio.start();
        if (success) {
          this.audioStarted = true;
          this.promptText.visible = false;
        }
      }
    };

    this._onKeyDown = (e) => {
      if (this.audioStarted && e.key === 'a') {
        this.audio.stop();
        this.audioStarted = false;
        this.promptText.visible = true;
      }
    };

    this.app.canvas.addEventListener('click', this._onClick);
    window.addEventListener('keydown', this._onKeyDown);
  }

  _calculateGrid() {
    this.cellWidth = this.sizes.width / this.cols;
    this.cellHeight = this.sizes.height / this.rows;
  }

  _initCells() {
    this.cells = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.cells.push({
          x: x * this.cellWidth + this.cellWidth / 2,
          y: y * this.cellHeight + this.cellHeight / 2,
          col: x,
          row: y,
          size: 0,
          targetSize: 0,
          isWhite: false,
        });
      }
    }
  }

  update(/* ticker */) {
    this.frameCount++;
    const g = this.g;
    g.clear();

    if (!this.audioStarted) {
      // Prompt text is a retained Text object — always visible until audio starts
      return;
    }

    const level = this.audio.getLevel();
    const spectrum = this.audio.getSpectrum();
    const bass = this.audio.getEnergyNormalized('bass');
    const isBeat = this.audio.isBeat(0.25, 80);

    // Beat: trigger global flash and random cell burst
    if (isBeat) {
      this.globalFlash = 1;
      this.lastBeatFrame = this.frameCount;
      this._triggerRandomCells(bass);
    }
    this.globalFlash *= 0.85;

    // Update and draw cells
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];

      const spectrumIndex = Math.floor((cell.col / this.cols) * spectrum.length);
      const spectrumValue = spectrum[spectrumIndex] / 255;

      const rowFactor = 1 - Math.abs(cell.row - this.rows / 2) / (this.rows / 2);
      cell.targetSize = spectrumValue * rowFactor * this.cellWidth * 0.9;

      cell.size = lerp(cell.size, cell.targetSize, 0.3);

      if (cell.isWhite || cell.size > 2) {
        const drawSize = cell.isWhite ? this.cellWidth * 0.9 : Math.max(cell.size, 2);
        const half = drawSize / 2;
        // PixiJS rect is top-left origin; p5's rectMode(CENTER) used center coords
        g.rect(cell.x - half, cell.y - half, drawSize, drawSize).fill(0xffffff);
      }

      // Decay white flash cells after 3 frames
      if (cell.isWhite && this.frameCount - this.lastBeatFrame > 3) {
        cell.isWhite = false;
      }
    }

    // Horizontal scan line on beat
    if (this.globalFlash > 0.1) {
      const lineY = (this.frameCount * 7) % this.sizes.height;
      g.rect(0, lineY - 1, this.sizes.width, 2).fill({
        color: 0xffffff,
        alpha: this.globalFlash,
      });
    }

    this._drawDataBar(level, bass);
  }

  _triggerRandomCells(intensity) {
    const count = Math.floor(intensity * this.cells.length * 0.3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * this.cells.length);
      this.cells[idx].isWhite = true;
    }
  }

  _drawDataBar(level, bass) {
    const g = this.g;
    const barHeight = 20;
    const segments = 64;
    const segmentWidth = this.sizes.width / segments;
    const t = this.frameCount;

    // Top bar — driven by amplitude
    for (let i = 0; i < segments; i++) {
      // noisejs perlin2 returns -1 to 1; rescale to 0-1
      const n = (this.noise.perlin2(i * 0.1, t * 0.05) + 1) / 2;
      if (Math.random() < n * level * 3) {
        g.rect(i * segmentWidth, 0, segmentWidth - 1, barHeight).fill(0xffffff);
      }
    }

    // Bottom bar — driven by bass
    for (let i = 0; i < segments; i++) {
      const n = (this.noise.perlin2(i * 0.15, t * 0.03) + 1) / 2;
      if (Math.random() < n * bass * 4) {
        g.rect(
          i * segmentWidth,
          this.sizes.height - barHeight,
          segmentWidth - 1,
          barHeight,
        ).fill(0xffffff);
      }
    }
  }

  resize(width, height) {
    this._calculateGrid();
    this._initCells();

    if (this.promptText) {
      this.promptText.position.set(width / 2, height / 2);
    }
  }

  destroy() {
    if (this._onClick) {
      this.app.canvas.removeEventListener('click', this._onClick);
      this._onClick = null;
    }
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
    if (this.audio) {
      this.audio.dispose();
      this.audio = null;
    }
    this.cells = [];
  }
}
