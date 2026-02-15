/**
 * AudioInput - A reusable audio input utility for p5.js
 *
 * Captures microphone input and provides amplitude, frequency spectrum,
 * and beat detection for audio-reactive visualizations.
 *
 * @example
 * // In your World class constructor:
 * this.audio = new AudioInput(p, { smoothing: 0.8 });
 *
 * // In setup() - must be triggered by user gesture (click/key):
 * await this.audio.start();
 *
 * // In draw():
 * const level = this.audio.getLevel();
 * const bass = this.audio.getEnergy('bass');
 */
export class AudioInput {
  /**
   * @param {p5} p - The p5 instance
   * @param {Object} options - Configuration options
   * @param {number} [options.smoothing=0.8] - FFT smoothing (0-1)
   * @param {number} [options.fftBins=64] - Number of FFT frequency bins (16, 32, 64, 128, 256, 512, 1024)
   * @param {number} [options.beatThreshold=0.5] - Default beat detection threshold
   * @param {number} [options.beatDecay=0.98] - Beat level decay rate
   */
  constructor(p, options = {}) {
    this.p = p;
    this.options = {
      smoothing: 0.8,
      fftBins: 64,
      beatThreshold: 0.5,
      beatDecay: 0.98,
      ...options,
    };

    this.mic = null;
    this.fft = null;
    this.amplitude = null;
    this.isRunning = false;

    // Beat detection state
    this.beatLevel = 0;
    this.lastBeatTime = 0;
    this.beatCutoff = this.options.beatThreshold;

    // Frequency band ranges (in Hz)
    this.bands = {
      bass: [20, 140],
      lowMid: [140, 400],
      mid: [400, 2600],
      highMid: [2600, 5200],
      treble: [5200, 14000],
    };
  }

  /**
   * Start capturing audio from the microphone.
   * Must be called after a user gesture (click, keypress, etc.)
   * @returns {Promise<boolean>} - Resolves true if started successfully
   */
  async start() {
    if (this.isRunning) return true;

    try {
      // Create audio input
      this.mic = new window.p5.AudioIn();

      // Create amplitude analyzer
      this.amplitude = new window.p5.Amplitude();

      // Create FFT analyzer
      this.fft = new window.p5.FFT(this.options.smoothing, this.options.fftBins);

      // Start the microphone
      await this.mic.start();

      // Connect analyzers to mic input
      this.amplitude.setInput(this.mic);
      this.fft.setInput(this.mic);

      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('AudioInput: Failed to start microphone', error);
      return false;
    }
  }

  /**
   * Stop capturing audio and release the microphone
   */
  stop() {
    if (!this.isRunning) return;

    if (this.mic) {
      this.mic.stop();
    }

    this.isRunning = false;
  }

  /**
   * Get the current amplitude level
   * @returns {number} - Amplitude value between 0 and 1
   */
  getLevel() {
    if (!this.isRunning || !this.amplitude) return 0;
    return this.amplitude.getLevel();
  }

  /**
   * Get the full frequency spectrum
   * @returns {number[]} - Array of amplitude values for each frequency bin (0-255)
   */
  getSpectrum() {
    if (!this.isRunning || !this.fft) return [];
    return this.fft.analyze();
  }

  /**
   * Get the waveform data
   * @returns {number[]} - Array of amplitude values (-1 to 1)
   */
  getWaveform() {
    if (!this.isRunning || !this.fft) return [];
    return this.fft.waveform();
  }

  /**
   * Get energy for a specific frequency band
   * @param {string|number|number[]} band - Band name ('bass', 'lowMid', 'mid', 'highMid', 'treble'),
   *                                         single frequency, or [lowFreq, highFreq] range
   * @returns {number} - Energy value between 0 and 255
   */
  getEnergy(band) {
    if (!this.isRunning || !this.fft) return 0;

    // Ensure spectrum is analyzed
    this.fft.analyze();

    if (typeof band === 'string' && this.bands[band]) {
      const [low, high] = this.bands[band];
      return this.fft.getEnergy(low, high);
    }

    if (Array.isArray(band)) {
      return this.fft.getEnergy(band[0], band[1]);
    }

    return this.fft.getEnergy(band);
  }

  /**
   * Get normalized energy for a frequency band (0-1)
   * @param {string|number|number[]} band - Band specification
   * @returns {number} - Normalized energy value between 0 and 1
   */
  getEnergyNormalized(band) {
    return this.getEnergy(band) / 255;
  }

  /**
   * Detect if a beat occurred based on amplitude threshold
   * @param {number} [threshold] - Beat threshold (0-1), defaults to options.beatThreshold
   * @param {number} [minInterval=100] - Minimum ms between beats
   * @returns {boolean} - True if beat detected
   */
  isBeat(threshold = this.options.beatThreshold, minInterval = 100) {
    if (!this.isRunning) return false;

    const level = this.getLevel();
    const now = Date.now();

    // Decay the beat cutoff over time
    this.beatCutoff *= this.options.beatDecay;
    this.beatCutoff = Math.max(this.beatCutoff, threshold);

    // Check for beat
    if (level > this.beatCutoff && now - this.lastBeatTime > minInterval) {
      this.beatCutoff = level * 1.1; // Raise cutoff above current level
      this.lastBeatTime = now;
      return true;
    }

    return false;
  }

  /**
   * Detect beat in a specific frequency band
   * @param {string} band - Frequency band ('bass', 'lowMid', 'mid', 'highMid', 'treble')
   * @param {number} [threshold=128] - Energy threshold (0-255)
   * @returns {boolean} - True if beat detected in that band
   */
  isBandBeat(band, threshold = 128) {
    return this.getEnergy(band) > threshold;
  }

  /**
   * Get the centroid frequency (brightness indicator)
   * @returns {number} - Centroid frequency in Hz
   */
  getCentroid() {
    if (!this.isRunning || !this.fft) return 0;
    this.fft.analyze();
    return this.fft.getCentroid();
  }

  /**
   * Check if audio input is currently running
   * @returns {boolean}
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.mic = null;
    this.fft = null;
    this.amplitude = null;
  }
}
