export enum TileType {
  SKY,
  GRASS,
  DIRT,
  STONE,
  WATER,
}

export interface WorldSettings {
  seed: number;
  tileSize: number;
  terrainRoughness: number;
  caveDensity: number;
  caveSize: number;
  waterAmount: number;
  biomeScale: number;
  mountainHeight: number;
  treeDensity: number;
  oreDensity: number;
}
