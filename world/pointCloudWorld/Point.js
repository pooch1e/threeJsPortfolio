/**
 * Point — animated point cloud plus line segments between randomly paired
 * points. While the track plays, each point's height is driven by the spectrum
 * band its x position falls in, so the cloud reads left-to-right as low-to-high
 * frequency, and every beat rewires a burst of lines at once. Before audio
 * unlocks it falls back to the sine ripple and a slow continuous rewire.
 */
import {
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  LineBasicMaterial,
  LineSegments,
} from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { buildPointBands, sineOffset } from "./utils/pointHelpers";

const SPREAD = 10;

export class Point {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.debug = experience.debug;
    this.audio = experience.audio;

    this.params = {
      count: 1000,
      size: 0.05,
      color: 0xffffff,
      scale: 0.01,
      bandCount: 64,
      audioGain: 3,
      sineAmplitude: 0.5,
      connectionsPerPoint: 1,
      lineColor: 0xffffff,
      lineOpacity: 0.3,
      chanceToConnect: 0.5,
      rewiresPerBeat: 40,
    };

    this.bands = this.audio?.setBandCount(this.params.bandCount) ?? null;

    this.setGeometry();
    this.setDebug();
  }

  buildPositions() {
    const { count, scale } = this.params;
    const positions = new Float32Array(count * 3);
    const perlin = new ImprovedNoise();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * SPREAD;
      const y = (Math.random() - 0.5) * SPREAD;
      const z = (Math.random() - 0.5) * SPREAD;

      positions[i3] = x + perlin.noise(x * scale, y * scale, z * scale);
      positions[i3 + 1] =
        y + perlin.noise(x * scale + 100, y * scale, z * scale);
      positions[i3 + 2] =
        z + perlin.noise(x * scale, y * scale + 100, z * scale);
    }

    return positions;
  }

  setGeometry() {
    this.geometry = new BufferGeometry();
    const positions = this.buildPositions();

    this.geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.adoptPositions(positions);

    this.material = new PointsMaterial({
      size: this.params.size,
      color: this.params.color,
    });

    this.points = new Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.setLines();
  }

  // the rest position every frame's displacement is measured from, plus the
  // band lookup that displacement is read out of — both are invalidated by a
  // rebuild, so they are always replaced together with the positions
  adoptPositions(positions) {
    this.originalPositions = new Float32Array(positions);
    this.pointBands = buildPointBands(
      positions,
      this.params.count,
      this.params.bandCount,
    );
  }

  setLines() {
    const { count, connectionsPerPoint } = this.params;

    // the pair behind each segment is kept rather than only its coordinates,
    // so both ends can be rewritten from the live point buffer each frame —
    // otherwise the lines stay behind at the positions the points have left
    this.lineLinks = new Int32Array(count * connectionsPerPoint * 2);
    for (let i = 0; i < count * connectionsPerPoint; i++) {
      this.lineLinks[i * 2] = i % count;
      this.lineLinks[i * 2 + 1] = Math.floor(Math.random() * count);
    }

    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(this.lineLinks.length * 3), 3),
    );

    const lineMaterial = new LineBasicMaterial({
      color: this.params.lineColor,
      transparent: true,
      opacity: this.params.lineOpacity,
    });

    this.lines = new LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lines);

    this.writeLinePositions();
  }

  writeLinePositions() {
    if (!this.lines) return;

    const linePositions = this.lines.geometry.attributes.position.array;
    const pointPositions = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.lineLinks.length; i++) {
      const from = this.lineLinks[i] * 3;
      const to = i * 3;

      linePositions[to] = pointPositions[from];
      linePositions[to + 1] = pointPositions[from + 1];
      linePositions[to + 2] = pointPositions[from + 2];
    }

    this.lines.geometry.attributes.position.needsUpdate = true;
  }

  rewireLinks(amount) {
    const segments = this.lineLinks.length / 2;

    for (let i = 0; i < amount; i++) {
      const segment = Math.floor(Math.random() * segments);
      this.lineLinks[segment * 2 + 1] = Math.floor(
        Math.random() * this.params.count,
      );
    }
  }

  updateGeometry() {
    this.points.geometry.dispose();

    const geometry = new BufferGeometry();
    const positions = this.buildPositions();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    this.points.geometry = geometry;
    this.adoptPositions(positions);

    this.scene.remove(this.lines);
    this.lines.geometry.dispose();
    this.lines.material.dispose();

    this.setLines();
  }

  rebuildBands() {
    this.bands = this.audio?.setBandCount(this.params.bandCount) ?? null;

    const positions = this.points.geometry.attributes.position.array;
    this.pointBands = buildPointBands(
      positions,
      this.params.count,
      this.params.bandCount,
    );
  }

  setDebug() {
    if (!this.debug.active) return;

    this.debugFolder = this.debug.ui.addFolder("Points");

    this.debugFolder
      .add(this.params, "count", 100, 50000, 100)
      .name("Count")
      .onChange(() => this.updateGeometry());

    this.debugFolder
      .add(this.params, "size", 0.01, 0.5, 0.01)
      .name("Size")
      .onChange(() => {
        this.material.size = this.params.size;
      });

    this.debugFolder
      .addColor(this.params, "color")
      .name("Color")
      .onChange(() => this.material.color.set(this.params.color));

    this.debugFolder
      .add(this.params, "scale", 0.01, 2, 0.01)
      .name("Noise Scale")
      .onChange(() => this.updateGeometry());

    const audioFolder = this.debug.ui.addFolder("Points Audio");
    this.audioFolder = audioFolder;

    audioFolder
      .add(this.params, "bandCount", 4, 128, 1)
      .name("Band Count")
      .onChange(() => this.rebuildBands());

    audioFolder.add(this.params, "audioGain", 0, 20, 0.1).name("Audio Gain");

    audioFolder
      .add(this.params, "sineAmplitude", 0, 3, 0.05)
      .name("Sine Amplitude");

    audioFolder
      .add(this.params, "rewiresPerBeat", 0, 500, 1)
      .name("Rewires Per Beat");

    const linesFolder = this.debug.ui.addFolder("Lines");
    this.linesFolder = linesFolder;

    linesFolder
      .add(this.params, "connectionsPerPoint", 0, 10, 1)
      .name("Connections Per Point")
      .onChange(() => this.updateGeometry());

    linesFolder
      .add(this.params, "lineOpacity", 0, 1, 0.01)
      .name("Line Opacity")
      .onChange(() => {
        this.lines.material.opacity = this.params.lineOpacity;
      });

    linesFolder
      .addColor(this.params, "lineColor")
      .name("Line Color")
      .onChange(() => this.lines.material.color.set(this.params.lineColor));

    linesFolder
      .add(this.params, "chanceToConnect", 0, 1, 0.01)
      .name("Reconnect Speed (No Audio)");
  }

  get isAudioDriven() {
    return Boolean(this.bands && this.audio?.isPlaying);
  }

  displacePoints(time) {
    const positions = this.points.geometry.attributes.position.array;
    const { count, audioGain, sineAmplitude } = this.params;
    const audioDriven = this.isAudioDriven;
    const seconds = time.elapsedTime * 0.001;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const offset = audioDriven
        ? this.bands[this.pointBands[i]] * audioGain
        : sineOffset(seconds, i, sineAmplitude);

      positions[i3 + 1] = this.originalPositions[i3 + 1] + offset;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }

  updateLinks() {
    if (!this.isAudioDriven) {
      if (Math.random() < this.params.chanceToConnect) this.rewireLinks(1);
      return;
    }

    if (this.audio.triggers.beat?.fired) {
      this.rewireLinks(this.params.rewiresPerBeat);
    }
  }

  update(time) {
    if (!this.points || !time) return;

    this.displacePoints(time);
    this.updateLinks();
    this.writeLinePositions();
  }

  destroy() {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.points.material.dispose();
    }

    if (this.lines) {
      this.scene.remove(this.lines);
      this.lines.geometry.dispose();
      this.lines.material.dispose();
    }

    this.debugFolder?.destroy();
    this.audioFolder?.destroy();
    this.linesFolder?.destroy();

    this.originalPositions = null;
    this.pointBands = null;
    this.lineLinks = null;
    this.bands = null;
  }
}
