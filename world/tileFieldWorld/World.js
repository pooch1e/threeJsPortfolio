/**
 * Composition root for the Tile Field. Owns the scene's parameters — a mutable
 * copy of tileFieldConfig, which the debug panel edits in place and TileField
 * reads on every step — and builds the grid once its sprites have loaded.
 */
import { Color } from "three";
import { TileField } from "./TileField";
import { DEFAULTS, FIELDS, RULES, SPRITES } from "./tileFieldConfig";

export class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.debug = experience.debug;
    this.resources = experience.resources;

    this.params = {
      ...DEFAULTS,
      fields: FIELDS.map((field) => ({ ...field })),
      rules: RULES.map((rule) => ({
        ...rule,
        band: [...rule.band],
        jGain: [...rule.jGain],
        lGain: [...rule.lGain],
      })),
    };

    this.scene.background = new Color(this.params.background);

    this.setDebug();

    this.resources.on("ready", () => {
      this.tileField = new TileField(experience, this.params);
    });
  }

  setDebug() {
    if (!this.debug.active) return;

    this.debugFolder = this.debug.ui.addFolder("Tile Field");

    this.debugFolder
      .addColor(this.params, "background")
      .name("Background")
      .onChange((value) => this.scene.background.set(value));

    this.debugFolder.add(this.params, "valueMin", 0, 0.9, 0.01);
    this.debugFolder.add(this.params, "alphaThreshold", 0, 1, 0.01);
    this.debugFolder.add(this.params, "stepMs", 16, 500, 1).name("Step (ms)");
    this.debugFolder.add(this.params, "holdMs", 0, 5000, 50).name("Hold (ms)");

    this.addGridDebug();
    this.addCursorDebug();
    this.addFieldsDebug();
    this.addRulesDebug();

    this.debugFolder
      .add({ copy: () => this.copyParams() }, "copy")
      .name("Copy params as JSON");
  }

  /* Grid controls change the cell count, so they rebuild rather than waiting
     for the next uniform write. */
  addGridDebug() {
    const folder = this.debugFolder.addFolder("Grid");
    folder.close();

    const rebuild = () => this.tileField?.rebuild();

    folder
      .add(this.params, "cellDivisor", 10, 120, 1)
      .name("Cells across")
      .onFinishChange(rebuild);
    folder.add(this.params, "bleed", 1, 1.5, 0.01).onFinishChange(rebuild);
    folder
      .add(this.params, "mobileCellPx", 6, 60, 1)
      .name("Mobile cell (px)")
      .onFinishChange(rebuild);
  }

  addCursorDebug() {
    const folder = this.debugFolder.addFolder("Cursor");
    folder.close();

    folder.add(this.params, "jRadiusFactor", 0, 2, 0.01).name("j radius");
    folder.add(this.params, "jMagnitude", 0, 0.5, 0.005).name("j magnitude");
    folder.add(this.params, "lRadiusFactor", 0, 2, 0.01).name("L radius");
    folder.add(this.params, "lMagnitude", 0, 0.5, 0.005).name("L magnitude");
  }

  addFieldsDebug() {
    const folder = this.debugFolder.addFolder("Fields");
    folder.close();

    this.params.fields.forEach((field, index) => {
      const fieldFolder = folder.addFolder(`Field ${index}`);
      fieldFolder.add(field, "frequency", 0.01, 0.5, 0.005);
      fieldFolder.add(field, "zSpeed", 0, 2, 0.0005).name("z drift");
      fieldFolder
        .add(field, "zOffset", 0, 10, 0.05)
        .name("z offset")
        .onChange(() => this.tileField?.resetFieldDrift(index));
    });
  }

  addRulesDebug() {
    const folder = this.debugFolder.addFolder("Rules");
    folder.close();

    const spriteNames = Object.keys(SPRITES);
    const fieldIndices = this.params.fields.map((_, index) => index);

    this.params.rules.forEach((rule) => {
      const ruleFolder = folder.addFolder(rule.name);
      ruleFolder.close();

      ruleFolder.add(rule, "sprite", spriteNames);
      ruleFolder.add(rule, "field", fieldIndices);
      ruleFolder.add(rule.band, "0", -1, 1.5, 0.005).name("band min");
      ruleFolder.add(rule.band, "1", -1, 1.5, 0.005).name("band max");
      ruleFolder.add(rule.jGain, "0", -2, 2, 0.05).name("j gain (min)");
      ruleFolder.add(rule.jGain, "1", -2, 2, 0.05).name("j gain (max)");
      ruleFolder.add(rule.lGain, "0", -2, 2, 0.05).name("L gain (min)");
      ruleFolder.add(rule.lGain, "1", -2, 2, 0.05).name("L gain (max)");
      ruleFolder.add(rule, "offset", 0, 1.5, 1 / 60);
      ruleFolder.add(rule, "size", 0.1, 2, 0.05);
    });
  }

  /* Tuning happens on sliders but has to survive a reload, so the panel can
     hand back something pasteable into tileFieldConfig.js. */
  copyParams() {
    const json = JSON.stringify(this.params, null, 2);

    navigator.clipboard?.writeText(json).catch(() => {
      console.warn("Clipboard unavailable — params logged above instead.");
    });
  }

  update(time) {
    this.tileField?.update(time);
  }

  destroy() {
    this.resources.off("ready");
    this.tileField?.destroy();
    this.debugFolder?.destroy();
  }
}
