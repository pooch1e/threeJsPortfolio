import { Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture } from "three";

export default class FlowerDataScroll {
  constructor(world, flowerField) {
    this.scene = world.scene;
    this.sizes = world.flowerExperience.sizes;

    this.scrollY = 0;
    this.scrollSpeed = 0.4; // pixels per frame

    this.lines = this.buildSceneData(flowerField);
    this.setPlane();
  }

  buildSceneData(flowerField) {
    const lines = [];
    const f = (n) => (typeof n === "number" ? n.toFixed(3) : String(n));

    // Top-level scene header
    lines.push('scene: "FlowerScene"');
    lines.push("children:");

    // Walk the Three.js scene graph
    const sceneRoot = flowerField.gltf?.scene;
    if (sceneRoot) {
      sceneRoot.children.forEach((child, idx) => {
        const type = child.isPoints
          ? "Points"
          : child.isMesh
            ? "Mesh"
            : child.type;
        lines.push(`  [${idx}] ${type} "${child.name || '(unnamed)'}"`);
        lines.push(`    visible: ${child.visible}`);
        lines.push(
          `    position: { x: ${f(child.position.x)}, y: ${f(child.position.y)}, z: ${f(child.position.z)} }`,
        );

        const geo = child.geometry;
        if (geo) {
          lines.push("    geometry:");
          const attrNames = Object.keys(geo.attributes);
          lines.push(`      attributes: [ ${attrNames.join(", ")} ]`);
          const posAttr = geo.attributes.position;
          if (posAttr) {
            lines.push(`      vertexCount: ${posAttr.count}`);
          }
        }

        const mat = child.material;
        if (mat) {
          lines.push(`    material: ${mat.type}`);
        }
      });
    }

    // GPGPU / particle system data from flowerField
    lines.push("");
    lines.push("gpgpu:");
    lines.push(`  textureSize: ${flowerField.gpgpu?.size ?? "?"}`);
    lines.push(`  particleCount: ${flowerField.baseGeometry?.count ?? "?"}`);

    const uniforms = flowerField.gpgpu?.particleVariable?.material?.uniforms;
    if (uniforms) {
      lines.push("  uniforms:");
      lines.push(`    uFieldInfluence: ${f(uniforms.uFieldInfluence?.value)}`);
      lines.push(`    uSize: ${f(flowerField.particles?.material?.uniforms?.uSize?.value)}`);
    }

    // Model scale + bounds
    lines.push("");
    lines.push("model:");
    lines.push(`  modelScale: ${f(flowerField.modelScale)}`);
    const b = flowerField.bounds;
    if (b) {
      lines.push("  bounds:");
      lines.push(`    x: [ ${f(b.minX)},  ${f(b.maxX)} ]`);
      lines.push(`    y: [ ${f(b.minY)},  ${f(b.maxY)} ]`);
      lines.push(`    z: [ ${f(b.minZ)},  ${f(b.maxZ)} ]`);
    }

    // Particle material attributes
    lines.push("");
    lines.push("particles:");
    const pGeo = flowerField.particles?.geometry;
    if (pGeo) {
      const attrNames = Object.keys(pGeo.attributes);
      lines.push(`  attributes: [ ${attrNames.join(", ")} ]`);
    }

    // Pad with blank lines at the end so the loop resets with visual breathing room
    for (let i = 0; i < 8; i++) lines.push("");

    return lines;
  }

  buildCanvas() {
    const lineHeight = 18;
    const fontSize = 13;
    const padding = 16;
    const canvasW = 512;
    const canvasH = this.lines.length * lineHeight + padding * 4;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    this._ctx = ctx;
    this._canvasW = canvasW;
    this._canvasH = canvasH;
    this._lineHeight = lineHeight;
    this._padding = padding;

    return canvas;
  }

  paintCanvas() {
    const { _ctx: ctx, _canvasW: w, _canvasH: h, _lineHeight: lh, _padding: pad } = this;

    // Clear to fully transparent each frame
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(0, -this.scrollY + pad);
    ctx.fillStyle = "#ffffff";
    ctx.font = `13px monospace`;
    ctx.textBaseline = "top";

    for (let i = 0; i < this.lines.length; i++) {
      ctx.fillText(this.lines[i], pad, i * lh);
    }

    ctx.restore();
  }

  setPlane() {
    this._canvas = this.buildCanvas();
    this.paintCanvas();

    this.canvasTexture = new CanvasTexture(this._canvas);

    // Plane sized to be readable — left side of view, in front of particle cloud
    // Camera at z=5, particles at z=1, plane at z=2
    const planeW = 2.2;
    const planeH = planeW * (this._canvasH / this._canvasW);

    this.geometry = new PlaneGeometry(planeW, planeH);
    this.material = new MeshBasicMaterial({
      map: this.canvasTexture,
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new Mesh(this.geometry, this.material);
    // Left side of the view, centred vertically, just in front of the particles

    this.scene.add(this.mesh);
  }

  update() {
    this.scrollY += this.scrollSpeed;

    // Seamless loop — reset when all content has scrolled past
    if (this.scrollY > this._canvasH) {
      this.scrollY = 0;
    }

    this.paintCanvas();
    this.canvasTexture.needsUpdate = true;
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.canvasTexture.dispose();
  }
}
