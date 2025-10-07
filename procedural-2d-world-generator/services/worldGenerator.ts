import { WORLD_WIDTH, WORLD_HEIGHT, TERRAIN_COLORS, SEED, TERRAIN_SMOOTHNESS, TERRAIN_AMPLITUDE, BASE_HEIGHT, DIRT_LAYER_THICKNESS, CAVE_SMOOTHNESS, CAVE_THRESHOLD, WATER_LEVEL } from '../constants';
import { TerrainType } from '../types';
import { WorldSettings } from '../types';

// Simple seeded random number generator
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  let x = Math.abs(hash);
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

// Simple 2D value noise function with smooth interpolation
function createValueNoise(prng: () => number, gridSize = 256): (x: number, y: number) => number {
  const grid: number[][] = [];
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = prng() * 2 - 1; // -1 to 1
    }
  }
  return (x: number, y: number) => {
    const ix = Math.floor(x * gridSize) % gridSize;
    const iy = Math.floor(y * gridSize) % gridSize;
    const fx = (x * gridSize) - Math.floor(x * gridSize);
    const fy = (y * gridSize) - Math.floor(y * gridSize);
    const a = grid[ix][iy];
    const b = grid[(ix + 1) % gridSize][iy];
    const c = grid[ix][(iy + 1) % gridSize];
    const d = grid[(ix + 1) % gridSize][(iy + 1) % gridSize];
    // Smooth interpolation using cosine
    const sx = 0.5 - 0.5 * Math.cos(fx * Math.PI);
    const sy = 0.5 - 0.5 * Math.cos(fy * Math.PI);
    const ab = a + (b - a) * sx;
    const cd = c + (d - c) * sx;
    return ab + (cd - ab) * sy;
  };
}

// Simple 2D Perlin noise function
function createPerlinNoise(prng: () => number, gridSize = 256): (x: number, y: number) => number {
  const gradients: [number, number][] = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.707, 0.707], [-0.707, 0.707], [0.707, -0.707], [-0.707, -0.707]
  ];
  const grid: [number, number][][] = [];
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = gradients[Math.floor(prng() * gradients.length)];
    }
  }

  const dot = (a: [number, number], b: [number, number]) => a[0] * b[0] + a[1] * b[1];

  return (x: number, y: number) => {
    const ix = Math.floor(x * gridSize) % gridSize;
    const iy = Math.floor(y * gridSize) % gridSize;
    const fx = (x * gridSize) - Math.floor(x * gridSize);
    const fy = (y * gridSize) - Math.floor(y * gridSize);

    const g00 = grid[ix][iy];
    const g10 = grid[(ix + 1) % gridSize][iy];
    const g01 = grid[ix][(iy + 1) % gridSize];
    const g11 = grid[(ix + 1) % gridSize][(iy + 1) % gridSize];

    const d00 = dot(g00, [fx, fy]);
    const d10 = dot(g10, [fx - 1, fy]);
    const d01 = dot(g01, [fx, fy - 1]);
    const d11 = dot(g11, [fx - 1, fy - 1]);

    const sx = 0.5 - 0.5 * Math.cos(fx * Math.PI);
    const sy = 0.5 - 0.5 * Math.cos(fy * Math.PI);

    const a = d00 + (d10 - d00) * sx;
    const b = d01 + (d11 - d01) * sx;
    return a + (b - a) * sy;
  };
}

// Fractal noise with octaves
function createFractalNoise(baseNoise: (x: number, y: number) => number, octaves: number): (x: number, y: number) => number {
  return (x: number, y: number) => {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += baseNoise(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  };
}

const getNoise = (simplex: any, x: number, y: number, scale: number): number => {
    return simplex(x / scale, y / scale);
};

export const generateWorld = (settings: WorldSettings): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = settings.worldWidth;
            canvas.height = settings.worldHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            
            const prng = seededRandom(settings.seed);
            const baseNoise = settings.noiseType === 'perlin' ? createPerlinNoise(prng) : createValueNoise(prng);
            const simplex = createFractalNoise(baseNoise, settings.octaves);
            
            for (let x = 0; x < settings.worldWidth; x++) {
                const terrainNoise = (getNoise(simplex, x, 0, settings.terrainSmoothness) + 1) / 2; // Normalize to 0-1
                const surfaceY = settings.baseHeight + (terrainNoise * settings.terrainAmplitude) - (settings.terrainAmplitude / 2);
                
                for (let y = 0; y < settings.worldHeight; y++) {
                    let terrainType: TerrainType;

                    if (y < surfaceY) {
                        terrainType = (y >= settings.waterLevel) ? TerrainType.WATER : TerrainType.SKY;
                    } else if (y < surfaceY + 2) { // A bit thicker grass layer
                        terrainType = TerrainType.GRASS;
                    } else if (y < surfaceY + settings.dirtLayerThickness) {
                        terrainType = TerrainType.DIRT;
                    } else {
                        terrainType = TerrainType.ROCK;
                    }
                    
                    if (terrainType === TerrainType.DIRT || terrainType === TerrainType.ROCK) {
                        const caveNoise = (getNoise(simplex, x, y, settings.caveSmoothness) + 1) / 2;
                        if (caveNoise > settings.caveThreshold) {
                            terrainType = TerrainType.CAVE;
                        }
                    }
                    
                    ctx.fillStyle = settings.terrainColors[terrainType];
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            resolve(canvas.toDataURL('image/png'));
        } catch (error) {
            reject(error);
        }
    });
};
