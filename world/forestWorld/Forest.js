import { Mesh, PlaneGeometry, MeshStandardMaterial, AmbientLight, DirectionalLight, RepeatWrapping } from "three";
import { randomElement } from "../../utils/helpers";


export class Forest {
  constructor(experience, gridSize) {
    this.experience = experience;
    this.gridSize = gridSize;
    this.scene = experience.scene;
    this.resources = experience.resources.items.flowerTextures;

    if (this.resources) {
      this.forestConfig = {
        tiles: [
          { type: 'blueFlower', texture: this.resources[0], density: 1 },
          { type: 'darkRedFlower', texture: this.resources[1], density: 1 },
          { type: 'redFlower', texture: this.resources[2], density: 1 },
          { type: 'roundLightGreen', texture: this.resources[3], density: 4 },
          { type: 'terrainDarkGreen', texture: this.resources[4], density: 5 },
          { type: 'tree', texture: this.resources[5], density: 1 },
        ]
      }
    }



    this.addLights()
    this.buildTilemap()
  }

  addLights() {
    this.scene.add(new AmbientLight("#ffffff", 1));
    const sun = new DirectionalLight("#ffffff", 2);
    sun.position.set(2, 3, 4);
    this.scene.add(sun);
  }

  createTile( tileConfig ) {
    const { texture, density } = tileConfig;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(density, density);

    const plane = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshStandardMaterial({ map: texture, transparent: true })
    );
    this.scene.add(plane);
    return plane
  }

  buildTilemap() {
    if (!this.forestConfig) return;

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const tileConfig = randomElement(this.forestConfig.tiles);
        const tile = this.createTile(tileConfig);
        tile.position.set(i, j, 0);
      }
    }
  }
}
