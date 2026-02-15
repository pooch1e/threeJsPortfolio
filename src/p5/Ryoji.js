import { AudioInput } from './AudioInput';

/**
 * Ryoji Ikeda-inspired black and white audio-reactive visualization
 * Features grid of squares that pulse and flash with audio input
 */
export class Ryoji {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;

    // Audio (fftSize: 64 gives 32 frequency bins)
    this.audio = new AudioInput(p, { smoothing: 0.7, fftSize: 64 });
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
  }

  setup(width, height) {
    this.width = width;
    this.height = height;
    this.p.createCanvas(width, height);
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);

    this.calculateGrid();
    this.initCells();

    // Start audio on click
    this.p.mousePressed = async () => {
      if (!this.audioStarted) {
        const success = await this.audio.start();
        if (success) {
          this.audioStarted = true;
        }
      }
    };

    // stop audio on spaceBar press
    this.p.keyPressed = () => {
      if (this.audioStarted) {
        if (this.p.key === 'a') {
          this.audio.stop();
        }
      }
    };
  }

  calculateGrid() {
    this.cellWidth = this.width / this.cols;
    this.cellHeight = this.height / this.rows;
  }

  initCells() {
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

  draw() {
    this.p.background(0);

    if (!this.audioStarted) {
      this.p.fill(255);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(16);
      this.p.text('CLICK TO START', this.width / 2, this.height / 2);
      return;
    }

    // Get audio data
    const level = this.audio.getLevel();
    const spectrum = this.audio.getSpectrum();
    const bass = this.audio.getEnergyNormalized('bass');
    const isBeat = this.audio.isBeat(0.25, 80);

    // Global flash on beat
    if (isBeat) {
      this.globalFlash = 1;
      this.lastBeatFrame = this.p.frameCount;
      this.triggerRandomCells(bass);
    }
    this.globalFlash *= 0.85;

    // Update and draw cells
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];

      // Map spectrum to columns
      const spectrumIndex = Math.floor(
        (cell.col / this.cols) * spectrum.length,
      );
      const spectrumValue = spectrum[spectrumIndex] / 255;

      // Calculate target size based on spectrum and row
      const rowFactor =
        1 - Math.abs(cell.row - this.rows / 2) / (this.rows / 2);
      cell.targetSize = spectrumValue * rowFactor * this.cellWidth * 0.9;

      // Smooth interpolation
      cell.size = this.p.lerp(cell.size, cell.targetSize, 0.3);

      // Draw cell
      if (cell.isWhite || cell.size > 2) {
        this.p.fill(255);
        const drawSize = cell.isWhite
          ? this.cellWidth * 0.9
          : Math.max(cell.size, 2);
        this.p.rect(cell.x, cell.y, drawSize, drawSize);
      }

      // Decay white flash cells
      if (cell.isWhite && this.p.frameCount - this.lastBeatFrame > 3) {
        cell.isWhite = false;
      }
    }

    // Draw horizontal scan lines on beat
    if (this.globalFlash > 0.1) {
      this.p.fill(255, this.globalFlash * 255);
      const lineY = (this.p.frameCount * 7) % this.height;
      this.p.rect(this.width / 2, lineY, this.width, 2);
    }

    // Top data bar - amplitude visualization
    this.drawDataBar(level, bass);
  }

  triggerRandomCells(intensity) {
    const count = Math.floor(intensity * this.cells.length * 0.3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(this.p.random(this.cells.length));
      this.cells[idx].isWhite = true;
    }
  }

  drawDataBar(level, bass) {
    const barHeight = 20;
    const segments = 64;
    const segmentWidth = this.width / segments;

    for (let i = 0; i < segments; i++) {
      // Create data-like pattern based on audio
      const threshold =
        this.p.noise(i * 0.1, this.p.frameCount * 0.05) * level * 3;
      if (this.p.random() < threshold) {
        this.p.fill(255);
        this.p.rect(
          i * segmentWidth + segmentWidth / 2,
          barHeight / 2,
          segmentWidth - 1,
          barHeight - 2,
        );
      }
    }

    // Bottom bar
    for (let i = 0; i < segments; i++) {
      const threshold =
        this.p.noise(i * 0.15, this.p.frameCount * 0.03) * bass * 4;
      if (this.p.random() < threshold) {
        this.p.fill(255);
        this.p.rect(
          i * segmentWidth + segmentWidth / 2,
          this.height - barHeight / 2,
          segmentWidth - 1,
          barHeight - 2,
        );
      }
    }
  }

  windowResized(width, height) {
    this.width = width;
    this.height = height;
    this.p.resizeCanvas(width, height);
    this.calculateGrid();
    this.initCells();
  }

  dispose() {
    this.audio.dispose();
  }
}
