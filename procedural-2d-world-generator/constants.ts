import { TerrainType } from './types';

export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1920;

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.SKY]: '#87CEEB',
  [TerrainType.WATER]: '#1E90FF',
  [TerrainType.GRASS]: '#32CD32',
  [TerrainType.DIRT]: '#8B4513',
  [TerrainType.ROCK]: '#808080',
  [TerrainType.CAVE]: '#282020',
};

// Generation parameters
export const SEED = 'hello-otherworldly-terrain'; // Change for a different world
export const TERRAIN_SMOOTHNESS = 500;
export const TERRAIN_AMPLITUDE = 180;
export const BASE_HEIGHT = WORLD_HEIGHT / 2.5;

export const DIRT_LAYER_THICKNESS = 250;

export const CAVE_SMOOTHNESS = 120;
export const CAVE_THRESHOLD = 0.65;

export const WATER_LEVEL = BASE_HEIGHT + 40;

export const NOISE_TYPE = 'perlin';
export const OCTAVES = 4;
