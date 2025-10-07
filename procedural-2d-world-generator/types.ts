export enum TerrainType {
  SKY,
  WATER,
  GRASS,
  DIRT,
  ROCK,
  CAVE,
}

export interface WorldSettings {
  worldWidth: number;
  worldHeight: number;
  terrainColors: Record<TerrainType, string>;
  seed: string;
  terrainSmoothness: number;
  terrainAmplitude: number;
  baseHeight: number;
  dirtLayerThickness: number;
  caveSmoothness: number;
  caveThreshold: number;
  waterLevel: number;
  noiseType: 'value' | 'perlin';
  octaves: number;
}
