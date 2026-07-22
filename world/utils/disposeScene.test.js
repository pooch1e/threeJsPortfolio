import { describe, it, expect, vi } from "vitest";
import { Scene, Mesh, BoxGeometry, MeshStandardMaterial, Texture } from "three";

import { disposeScene } from "./disposeScene";

describe("disposeScene", () => {
  it("disposes geometry, material, and material textures", () => {
    const scene = new Scene();
    const texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture });
    const geometry = new BoxGeometry();
    scene.add(new Mesh(geometry, material));

    const geometrySpy = vi.spyOn(geometry, "dispose");
    const materialSpy = vi.spyOn(material, "dispose");
    const textureSpy = vi.spyOn(texture, "dispose");

    disposeScene(scene);

    expect(geometrySpy).toHaveBeenCalled();
    expect(materialSpy).toHaveBeenCalled();
    expect(textureSpy).toHaveBeenCalled();
  });
});
