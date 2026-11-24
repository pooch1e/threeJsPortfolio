/**
 * RbiFinalWorld — the "B" side of the RBI test: a Ryoji Ikeda style data
 * visual of the earth, seen from a fixed camera through a crosshair.
 *
 * Every pattern is built from the same idea: split space into cells
 * (`floor`), give each cell a random value (`hash`), threshold it (`step`),
 * and advance it on quantised time (`floor(time * rate)`) so it ticks rather
 * than flickers. Lines use `fwidth` so they stay one pixel thin at any depth.
 *
 * Pieces:
 *   earth      desaturated day texture with a lat/long graticule overlay
 *   crosshair  camera-facing reticle between the camera and the earth: a
 *              ring with rotating ticks and a dashed inner ring (polar
 *              coordinates), plus two arms carrying a ruler and sparse data
 *              bars scrolling outward
 *   barcodes   two tall side columns of hashed bars, scrolling (image 3 style)
 *
 * All materials are unlit and opt out of tone mapping so white is 1 and
 * red is exactly the red uniform.
 */
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  uv, float, uniform, time, texture,
  floor, fract, step, smoothstep, abs, min, max, mix, atan, fwidth, hash, saturation,
} from 'three/tsl';

const EARTH_RADIUS = 7;
const CROSSHAIR_DISTANCE = 12;
const CROSSHAIR_WIDTH = 0.7;

export class RbiFinalWorld {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.resources = experience.resources;
    this.camera = experience.camera.perspectiveCamera;
    this.inspector = experience.renderer.renderer.inspector;

    this.scene.background = new THREE.Color('#000000');

    this.setUniforms();
    this.setEarth();
    this.setCrosshair();
    this.setBarcodes();
    this.setParameters();
  }

  setUniforms() {
    this.u = {
      white: uniform(new THREE.Color('#ffffff')),
      red: uniform(new THREE.Color('#ff1a2a')),
      tickRate: uniform(4),
      crosshairSpeed: uniform(0.4),
      crosshairDensity: uniform(8),
      crosshairThreshold: uniform(0.7),
      crosshairRedRatio: uniform(0.08),
      ringRadius: uniform(5.5),
      ringSpin: uniform(0.01),
      ringTicks: uniform(180),
      barcodeThreshold: uniform(0.45),
      barcodeRedRatio: uniform(0.12),
      barcodeScroll: uniform(0.4),
      barcodeRows: uniform(90),
      earthSaturation: uniform(0),
      earthBrightness: uniform(0.55),
      earthGrid: uniform(0.35),
      earthSpin: uniform(0.04),
    };

    this.steppedTime = floor(time.mul(this.u.tickRate));
  }

  createOverlayMaterial() {
    return new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }

  pixelLine(value, target, widthPx = 1) {
    const aa = fwidth(value);
    return float(1).sub(smoothstep(aa.mul(widthPx * 0.5), aa.mul(widthPx * 0.5 + 1), abs(value.sub(target))));
  }

  setEarth() {
    const dayTexture = this.resources.items.earthTextures[0];
    const { u } = this;

    const earthColor = saturation(texture(dayTexture).rgb, u.earthSaturation).mul(u.earthBrightness);

    const meridians = fract(uv().x.mul(24));
    const parallels = fract(uv().y.mul(12));
    const graticule = max(
      this.pixelLine(min(meridians, float(1).sub(meridians)), 0),
      this.pixelLine(min(parallels, float(1).sub(parallels)), 0),
    );

    const material = new MeshBasicNodeMaterial({ toneMapped: false });
    material.colorNode = mix(earthColor, u.white, graticule.mul(u.earthGrid));

    this.earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, 96, 64), material);
    this.scene.add(this.earth);
  }

  createCrosshairArmMaterial(seed) {
    const { u } = this;

    const along = abs(uv().x.sub(0.5)).mul(2);
    const across = uv().y;
    const sideOffset = abs(across.sub(0.5));
    const armId = step(0.5, uv().x).add(step(0.5, across).mul(2)).add(seed * 4);

    const centreLine = this.pixelLine(across, 0.5, 1.5);

    const rulerPhase = fract(along.mul(u.crosshairDensity).mul(2));
    const ruler = this.pixelLine(min(rulerPhase, float(1).sub(rulerPhase)), 0)
      .mul(step(sideOffset, 0.06));

    const cellCoord = along.mul(u.crosshairDensity).sub(time.mul(u.crosshairSpeed));
    const cellPhase = fract(cellCoord);
    const cellSeed = floor(cellCoord).mul(8).add(armId).add(10000);

    const present = step(u.crosshairThreshold, hash(cellSeed));
    const blink = step(0.15, hash(cellSeed.add(this.steppedTime.mul(977))));
    const barLength = mix(float(0.15), float(0.7), hash(cellSeed.add(17)));
    const barHeight = mix(float(0.03), float(0.25), hash(cellSeed.add(29)).pow(2));
    const inBar = step(cellPhase, barLength)
      .mul(step(0.1, sideOffset))
      .mul(step(sideOffset, barHeight.add(0.1)));
    const clearOfCentre = step(0.08, along);
    const bars = present.mul(blink).mul(inBar).mul(clearOfCentre);

    const isRed = step(float(1).sub(u.crosshairRedRatio), hash(cellSeed.add(53)));
    const endFade = smoothstep(1, 0.85, along);

    const material = this.createOverlayMaterial();
    material.colorNode = mix(u.white, u.red, bars.mul(isRed).mul(float(1).sub(centreLine)));
    material.opacityNode = max(max(centreLine, ruler), bars).mul(endFade);
    return material;
  }

  createRingMaterial(extent) {
    const { u } = this;

    const p = uv().sub(0.5).mul(extent * 2);
    const r = p.length();
    const angle = atan(p.y, p.x).div(Math.PI * 2).add(0.5);
    const spunAngle = fract(angle.add(time.mul(u.ringSpin)));

    const outerRing = this.pixelLine(r, u.ringRadius, 1.5);

    const tickCoord = spunAngle.mul(u.ringTicks);
    const tickPhase = fract(tickCoord);
    const tickLine = this.pixelLine(min(tickPhase, float(1).sub(tickPhase)), 0);
    const isMajor = step(fract(floor(tickCoord).div(10)), 0.05);
    const tickLength = mix(float(0.15), float(0.45), isMajor);
    const ticks = tickLine.mul(step(u.ringRadius, r)).mul(step(r, u.ringRadius.add(tickLength)));

    const dashes = step(0.5, fract(angle.mul(120).add(time.mul(u.ringSpin).mul(240))));
    const innerRing = this.pixelLine(r, u.ringRadius.mul(0.72)).mul(dashes);

    const material = this.createOverlayMaterial();
    material.colorNode = u.white;
    material.opacityNode = max(max(outerRing, ticks), innerRing);
    return material;
  }

  /**
   * The reticle is placed in camera space once, at construction: the B
   * camera is fixed, so it never needs re-aligning per frame.
   */
  setCrosshair() {
    const halfHeight = CROSSHAIR_DISTANCE * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));

    const horizontal = new THREE.Mesh(
      new THREE.PlaneGeometry(halfHeight * 2.6, CROSSHAIR_WIDTH),
      this.createCrosshairArmMaterial(1),
    );

    const vertical = new THREE.Mesh(
      new THREE.PlaneGeometry(halfHeight * 1.7, CROSSHAIR_WIDTH),
      this.createCrosshairArmMaterial(2),
    );
    vertical.rotation.z = Math.PI / 2;

    const ringExtent = halfHeight + 1;
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(ringExtent * 2, ringExtent * 2),
      this.createRingMaterial(ringExtent),
    );
    ring.position.z = -0.01;

    const forward = this.camera.getWorldDirection(new THREE.Vector3());
    this.crosshair = new THREE.Group();
    this.crosshair.add(ring, horizontal, vertical);
    this.crosshair.position.copy(this.camera.position).addScaledVector(forward, CROSSHAIR_DISTANCE);
    this.crosshair.quaternion.copy(this.camera.quaternion);
    this.scene.add(this.crosshair);
  }

  createBarcodeMaterial(seed) {
    const { u } = this;
    const p = uv();

    const frameLeft = this.pixelLine(p.x, 0.06, 1.5);
    const frameRight = this.pixelLine(p.x, 0.94, 1.5);

    const rulerPhase = fract(p.y.mul(60));
    const ruler = this.pixelLine(min(rulerPhase, float(1).sub(rulerPhase)), 0)
      .mul(step(p.x, 0.04));

    const inner = step(0.12, p.x).mul(step(p.x, 0.88));
    const lane = floor(p.x.sub(0.12).div(0.76).mul(3));
    const rowCoord = p.y.mul(u.barcodeRows).add(time.mul(u.barcodeScroll).mul(u.barcodeRows).mul(0.1));
    const rowId = floor(rowCoord);
    const cellSeed = rowId.mul(3).add(lane).add(seed * 100000).add(50000);

    const isLive = step(0.85, hash(cellSeed.add(7)));
    const flickerSeed = cellSeed.add(this.steppedTime.mul(isLive).mul(311));
    const on = step(u.barcodeThreshold, hash(flickerSeed)).mul(inner);
    const grey = mix(float(0.35), float(1), step(0.7, hash(cellSeed.add(19))));
    const isRed = step(float(1).sub(u.barcodeRedRatio), hash(flickerSeed.add(41))).mul(on);

    const redMarker = step(0.9, hash(rowId.add(seed * 7000).add(this.steppedTime.mul(53))))
      .mul(step(0.88, p.x)).mul(step(p.x, 0.92));

    const red = max(isRed, redMarker);
    const white = max(max(frameLeft, frameRight), max(ruler, on.mul(grey)));

    const material = this.createOverlayMaterial();
    material.colorNode = mix(u.white, u.red, red);
    material.opacityNode = max(white, red);
    return material;
  }

  setBarcodes() {
    const geometry = new THREE.PlaneGeometry(3.2, 30);

    this.barcodeLeft = new THREE.Mesh(geometry, this.createBarcodeMaterial(1));
    this.barcodeLeft.position.set(-30, 0, -2);
    this.barcodeLeft.rotation.y = 0.35;

    this.barcodeRight = new THREE.Mesh(geometry.clone(), this.createBarcodeMaterial(2));
    this.barcodeRight.position.set(30, 0, -2);
    this.barcodeRight.rotation.y = -0.35;

    this.scene.add(this.barcodeLeft, this.barcodeRight);
  }

  setParameters() {
    const { u } = this;

    const crosshair = this.inspector.createParameters('Ikeda — Crosshair');
    crosshair.add(this.crosshair, 'visible');
    crosshair.add(u.crosshairSpeed, 'value', 0, 3, 0.01).name('scroll speed');
    crosshair.add(u.crosshairDensity, 'value', 2, 40, 1).name('cell density');
    crosshair.add(u.crosshairThreshold, 'value', 0, 1, 0.01).name('threshold');
    crosshair.add(u.crosshairRedRatio, 'value', 0, 1, 0.01).name('red ratio');
    crosshair.add(u.ringRadius, 'value', 1, 9, 0.05).name('ring radius');
    crosshair.add(u.ringSpin, 'value', -0.1, 0.1, 0.001).name('ring spin');
    crosshair.add(u.ringTicks, 'value', 20, 720, 10).name('ring ticks');

    const barcodes = this.inspector.createParameters('Ikeda — Side barcodes');
    barcodes.add(u.barcodeThreshold, 'value', 0, 1, 0.01).name('threshold');
    barcodes.add(u.barcodeRedRatio, 'value', 0, 1, 0.01).name('red ratio');
    barcodes.add(u.barcodeRows, 'value', 10, 300, 1).name('rows');
    barcodes.add(u.barcodeScroll, 'value', -3, 3, 0.01).name('scroll');

    const timing = this.inspector.createParameters('Ikeda — Timing');
    timing.add(u.tickRate, 'value', 0, 30, 0.5).name('tick rate (hz)');

    const earth = this.inspector.createParameters('Ikeda — Earth');
    earth.add(this.earth, 'visible');
    earth.add(u.earthSaturation, 'value', 0, 1.5, 0.01).name('saturation');
    earth.add(u.earthBrightness, 'value', 0, 2, 0.01).name('brightness');
    earth.add(u.earthGrid, 'value', 0, 1, 0.01).name('graticule');
    earth.add(u.earthSpin, 'value', -1, 1, 0.01).name('spin');
  }

  update(time) {
    this.earth.rotation.y += time.deltaTime * 0.001 * this.u.earthSpin.value;
  }

  destroy() {}
}
