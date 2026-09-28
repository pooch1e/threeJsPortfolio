/**
 * TileField — the grid itself. One mesh per rule, all six sharing a single
 * InstancedBufferGeometry of one instance per cell, so a rule costs a draw call
 * and a set of uniforms rather than a copy of the grid.
 *
 * Nothing about the field is computed in JavaScript: the vertex shader reads
 * its cell from aCell, evaluates the noise, applies the cursor offsets, tests
 * its rule's band and discards the cell by collapsing it behind the far plane.
 * The cursor is therefore a single uniform write per step.
 *
 * Geometry is built from a plain InstancedBufferGeometry rather than an
 * InstancedMesh because the instances carry no per-instance matrix — position
 * comes entirely from aCell — and an InstancedMesh would both upload a matrix
 * per cell and derive its culling bounds from those identity matrices.
 */
import {
  PlaneGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  DynamicDrawUsage,
  ShaderMaterial,
  Uniform,
  Vector2,
  Mesh,
  SRGBColorSpace,
} from "three";
import vertexShader from "./shaders/tileField/vertex.glsl";
import fragmentShader from "./shaders/tileField/fragment.glsl";
import { SPRITE_SOURCE, SPRITES, MAX_COLS, MAX_ROWS } from "./tileFieldConfig";
import {
  computeGridDimensions,
  cursorToGridSpace,
  gridDiagonal,
} from "./utils/tileFieldHelpers";

const MAX_CELLS = MAX_COLS * MAX_ROWS;
const CURSOR_AT_REST = 1e4;

export class TileField {
  constructor(experience, params) {
    this.experience = experience;
    this.scene = experience.scene;
    this.camera = experience.camera;
    this.sizes = experience.sizes;
    this.mouse = experience.mouse;
    this.params = params;

    this.textures = experience.resources.items[SPRITE_SOURCE] ?? [];
    this.textures.forEach((texture) => {
      if (texture) texture.colorSpace = SRGBColorSpace;
    });

    this.cols = 0;
    this.rows = 0;
    this.frustumWidth = 1;
    this.frustumHeight = 1;
    this.lastStepAt = 0;
    this.firstUpdateAt = null;
    this.holdComplete = false;
    this.cursorPresent = false;
    this.cursorNdc = new Vector2();

    this.buildGeometry();
    this.buildUniforms();
    this.buildRules();
    this.rebuild();

    this.sizes.on("resize.tileField", () => this.rebuild());
    this.mouse?.on("move.tileField", (position) => {
      this.cursorNdc.copy(position);
      this.cursorPresent = true;
    });
    this.mouse?.on("leave.tileField", () => {
      this.cursorPresent = false;
    });
  }

  buildGeometry() {
    const plane = new PlaneGeometry(1, 1);

    this.geometry = new InstancedBufferGeometry();
    this.geometry.index = plane.index;
    this.geometry.setAttribute("position", plane.attributes.position);
    this.geometry.setAttribute("uv", plane.attributes.uv);

    this.cellArray = new Float32Array(MAX_CELLS * 2);
    this.cellAttribute = new InstancedBufferAttribute(this.cellArray, 2);
    this.cellAttribute.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("aCell", this.cellAttribute);
  }

  buildUniforms() {
    this.sharedUniforms = {
      uGrid: new Uniform(new Vector2()),
      uCursor: new Uniform(new Vector2()),
      uCursorRadius: new Uniform(new Vector2()),
      uCursorMagnitude: new Uniform(new Vector2()),
      uValueMin: new Uniform(0),
      uAlphaThreshold: new Uniform(0),
    };

    this.fieldUniforms = this.params.fields.map(() => ({
      uFieldFrequency: new Uniform(0),
      uFieldZ: new Uniform(0),
    }));
  }

  buildRules() {
    this.rules = this.params.rules.map((rule, index) => {
      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          ...this.sharedUniforms,
          ...this.fieldUniforms[rule.field],
          uBand: new Uniform(new Vector2()),
          uJGain: new Uniform(new Vector2()),
          uLGain: new Uniform(new Vector2()),
          uOffset: new Uniform(0),
          uSize: new Uniform(0),
          uTexture: new Uniform(null),
        },
      });

      const mesh = new Mesh(this.geometry, material);
      // Instances carry no matrices, so the geometry's bounds say nothing
      // about where the cells actually end up
      mesh.frustumCulled = false;
      // The original's later rules paint over its earlier ones
      mesh.renderOrder = index;
      this.scene.add(mesh);

      return { rule, material, mesh };
    });
  }

  /* Sync, not debounced: the cursor mapping reads this frustum, so a stale
     copy mid-drag would offset the clearing from the pointer. */
  rebuild() {
    const { cols, rows, frustumWidth, frustumHeight, capped } =
      computeGridDimensions({
        width: this.sizes.width,
        height: this.sizes.height,
        cellDivisor: this.params.cellDivisor,
        bleed: this.params.bleed,
        mobileCellPx: this.params.mobileCellPx,
        mobileBreakpoint: this.params.mobileBreakpoint,
        maxCols: MAX_COLS,
        maxRows: MAX_ROWS,
      });

    this.cols = cols;
    this.rows = rows;
    this.frustumWidth = frustumWidth;
    this.frustumHeight = frustumHeight;

    if (capped) {
      console.warn(
        `TileField hit its ${MAX_COLS}x${MAX_ROWS} cell ceiling; cells are larger than cellDivisor asks for. Raise the ceiling or the divisor.`,
      );
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const index = (row * this.cols + col) * 2;
        this.cellArray[index] = col;
        this.cellArray[index + 1] = row;
      }
    }

    this.cellAttribute.needsUpdate = true;
    this.geometry.instanceCount = this.cols * this.rows;

    this.camera.setFrustumHeight(this.frustumHeight);
    this.applyParams();
  }

  /* Drift accumulates onto the offset, so changing one field's offset has to
     restart that field's accumulation — and only that field's, or nudging one
     slider would discard the other's drift. */
  resetFieldDrift(index) {
    this.fieldUniforms[index].uFieldZ.value = this.params.fields[index].zOffset;
  }

  cursorGridPosition() {
    if (!this.cursorPresent || !this.holdComplete) {
      return { x: CURSOR_AT_REST, y: CURSOR_AT_REST };
    }

    return cursorToGridSpace(
      this.cursorNdc.x,
      this.cursorNdc.y,
      this.frustumWidth,
      this.frustumHeight,
    );
  }

  /* The single place uniforms are written, so live debug edits have one seam
     to go through. */
  applyParams() {
    const diagonal = gridDiagonal(this.cols, this.rows);
    const cursor = this.cursorGridPosition();

    this.sharedUniforms.uGrid.value.set(this.cols, this.rows);
    this.sharedUniforms.uCursor.value.set(cursor.x, cursor.y);
    this.sharedUniforms.uCursorRadius.value.set(
      this.params.jRadiusFactor * diagonal,
      this.params.lRadiusFactor * diagonal,
    );
    this.sharedUniforms.uCursorMagnitude.value.set(
      this.params.jMagnitude,
      this.params.lMagnitude,
    );
    this.sharedUniforms.uValueMin.value = this.params.valueMin;
    this.sharedUniforms.uAlphaThreshold.value = this.params.alphaThreshold;

    this.fieldUniforms.forEach((uniforms, index) => {
      uniforms.uFieldFrequency.value = this.params.fields[index].frequency;
    });

    this.rules.forEach(({ rule, material }) => {
      const { uniforms } = material;

      uniforms.uBand.value.set(rule.band[0], rule.band[1]);
      uniforms.uJGain.value.set(rule.jGain[0], rule.jGain[1]);
      uniforms.uLGain.value.set(rule.lGain[0], rule.lGain[1]);
      uniforms.uOffset.value = rule.offset;
      uniforms.uSize.value = rule.size;
      uniforms.uTexture.value = this.textures[SPRITES[rule.sprite]] ?? null;

      // Rebound rather than spread once, so switching a rule's field in the
      // debug panel repoints it at that field's drift instead of its old one
      uniforms.uFieldFrequency = this.fieldUniforms[rule.field].uFieldFrequency;
      uniforms.uFieldZ = this.fieldUniforms[rule.field].uFieldZ;
    });
  }

  update(time) {
    // Timed from the first frame this grid draws, not from the Experience's
    // clock: the sprites load first, and on a cold cache that alone can outlast
    // holdMs, skipping the static opening entirely
    if (this.firstUpdateAt === null) {
      this.firstUpdateAt = time.elapsedTime;
    }

    if (!this.holdComplete) {
      if (time.elapsedTime - this.firstUpdateAt < this.params.holdMs) {
        this.applyParams();
        return;
      }

      this.holdComplete = true;
      this.lastStepAt = time.elapsedTime;
    }

    const sinceStep = time.elapsedTime - this.lastStepAt;
    if (sinceStep < this.params.stepMs) return;

    this.fieldUniforms.forEach((uniforms, index) => {
      uniforms.uFieldZ.value +=
        this.params.fields[index].zSpeed * (sinceStep / 1000);
    });

    this.lastStepAt = time.elapsedTime;
    this.applyParams();
  }

  destroy() {
    this.sizes.off("resize.tileField");
    this.mouse?.off("move.tileField");
    this.mouse?.off("leave.tileField");

    this.rules.forEach(({ mesh, material }) => {
      this.scene.remove(mesh);
      material.dispose();
    });

    // Textures belong to Resources, which outlives this scene's world
    this.geometry.dispose();
  }
}
