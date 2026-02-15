/**
 * AudioInput - A reusable audio input utility for p5.js
 *
 * Uses native Web Audio API to capture microphone input and provides
 * amplitude, frequency spectrum, and beat detection for audio-reactive visualizations.
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
   * @param {p5} p - The p5 instance (used for utility functions)
   * @param {Object} options - Configuration options
   * @param {number} [options.smoothing=0.8] - FFT smoothing (0-1)
   * @param {number} [options.fftSize=256] - FFT size (power of 2: 32, 64, 128, 256, 512, 1024, 2048)
   * @param {number} [options.beatThreshold=0.5] - Default beat detection threshold
   * @param {number} [options.beatDecay=0.98] - Beat level decay rate
   */
  constructor(p, options = {}) {
    this.p = p;
    this.options = {
      smoothing: 0.8,
      fftSize: 256,
      beatThreshold: 0.5,
      beatDecay: 0.98,
      ...options,
    };

    // Web Audio API nodes
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.mediaStream = null;

    // Data arrays
    this.frequencyData = null;
    this.timeDomainData = null;

    this.isRunning = false;

    // Beat detection state
    this.lastBeatTime = 0;
    this.beatCutoff = this.options.beatThreshold;

    // Frequency band ranges as bin indices (calculated after start)
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
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.options.fftSize;
      this.analyser.smoothingTimeConstant = this.options.smoothing;

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.microphone.connect(this.analyser);

      // Initialize data arrays
      const bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(bufferLength);
      this.timeDomainData = new Uint8Array(bufferLength);

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

    if (this.microphone) {
      this.microphone.disconnect();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isRunning = false;
  }

  /**
   * Get the current amplitude level
   * @returns {number} - Amplitude value between 0 and 1
   */
  getLevel() {
    if (!this.isRunning || !this.analyser) return 0;

    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Calculate RMS (root mean square) for amplitude
    let sum = 0;
    for (let i = 0; i < this.timeDomainData.length; i++) {
      const normalized = (this.timeDomainData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / this.timeDomainData.length);
  }

  /**
   * Get the full frequency spectrum
   * @returns {Uint8Array} - Array of amplitude values for each frequency bin (0-255)
   */
  getSpectrum() {
    if (!this.isRunning || !this.analyser) return new Uint8Array(0);

    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  /**
   * Get the waveform data
   * @returns {Uint8Array} - Array of amplitude values (0-255, centered at 128)
   */
  getWaveform() {
    if (!this.isRunning || !this.analyser) return new Uint8Array(0);

    this.analyser.getByteTimeDomainData(this.timeDomainData);
    return this.timeDomainData;
  }

  /**
   * Convert frequency (Hz) to FFT bin index
   * @param {number} freq - Frequency in Hz
   * @returns {number} - Bin index
   */
  freqToBin(freq) {
    const nyquist = this.audioContext.sampleRate / 2;
    return Math.round((freq / nyquist) * this.analyser.frequencyBinCount);
  }

  /**
   * Get energy for a specific frequency band
   * @param {string|number[]} band - Band name ('bass', 'lowMid', 'mid', 'highMid', 'treble')
   *                                  or [lowFreq, highFreq] range in Hz
   * @returns {number} - Energy value between 0 and 255
   */
  getEnergy(band) {
    if (!this.isRunning || !this.analyser) return 0;

    this.analyser.getByteFrequencyData(this.frequencyData);

    let lowFreq, highFreq;

    if (typeof band === 'string' && this.bands[band]) {
      [lowFreq, highFreq] = this.bands[band];
    } else if (Array.isArray(band)) {
      [lowFreq, highFreq] = band;
    } else {
      return 0;
    }

    const lowBin = this.freqToBin(lowFreq);
    const highBin = this.freqToBin(highFreq);

    let sum = 0;
    let count = 0;
    for (let i = lowBin; i <= highBin && i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
      count++;
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Get normalized energy for a frequency band (0-1)
   * @param {string|number[]} band - Band specification
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
    this.analyser = null;
    this.microphone = null;
    this.audioContext = null;
    this.frequencyData = null;
    this.timeDomainData = null;
  }
}
