import { Mesh, LineSegments, Points } from "three";

export function disposeScene(scene) {
  scene.traverse((child) => {
    if (
      child instanceof Mesh ||
      child instanceof LineSegments ||
      child instanceof Points
    ) {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material) => {
          for (const key in material) {
            const value = material[key];
            if (value && typeof value.dispose === "function") {
              value.dispose();
            }
          }
          material.dispose();
        });
      }
    }
  });
}
