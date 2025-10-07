import { TileType, WorldSettings } from '../types';
import SimplexNoise from '../utils/simplex-noise';

export const generateWorld = (settings: WorldSettings, mapWidth: number, mapHeight: number): TileType[][] => {
    const { seed, tileSize, terrainRoughness, caveDensity, caveSize, waterAmount, biomeScale, mountainHeight, treeDensity, oreDensity } = settings;
    
    const gridWidth = mapWidth / tileSize;
    const gridHeight = mapHeight / tileSize;

    const terrainNoise = new SimplexNoise(seed.toString());
    const caveNoise = new SimplexNoise((seed + 1).toString());
    const prng = mulberry32(seed);

    const world: TileType[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(TileType.SKY));

    // 1. Generate Terrain Heightmap and Basic Layers
    const dirtLayerDepth = 50;
    const surfaceLevel = gridHeight * 0.3;

    for (let x = 0; x < gridWidth; x++) {
        const freq1 = 1 / (gridWidth / (terrainRoughness / 20)) * (biomeScale / 100);
        const freq2 = freq1 * 2;
        const freq3 = freq1 * 4;

        let height = surfaceLevel;
        height += terrainNoise.noise2D(x * freq1, 0) * (gridHeight * 0.1) * (mountainHeight / 50); // Rolling hills
        height += terrainNoise.noise2D(x * freq2, 0) * (gridHeight * 0.05) * (mountainHeight / 50); // Medium features
        height += terrainNoise.noise2D(x * freq3, 0) * (gridHeight * 0.025) * (mountainHeight / 50); // Small details

        // Add occasional cliffs and overhangs with a second noise layer
        const overhangFactor = (caveNoise.noise2D(x * 0.05, 50) + 1) / 2; // value 0 to 1
        const overhangOffset = Math.pow(overhangFactor, 4) * Math.sin(x * 0.1) * 20;

        for (let y = 0; y < gridHeight; y++) {
            let currentHeight = height + overhangOffset;

            if (y > currentHeight) {
                 if (y < currentHeight + 1) {
                    world[y][x] = TileType.GRASS;
                } else if (y < currentHeight + dirtLayerDepth) {
                    world[y][x] = TileType.DIRT;
                } else {
                    world[y][x] = TileType.STONE;
                }
            }
        }
    }

    // 2. Carve Caves
    const caveThreshold = 1.0 - (caveDensity / 100.0) * 0.7; // Map 1-100 to a threshold of 1.0-0.3
    const caveFreq = (caveSize / 1000);
    
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (world[y][x] === TileType.DIRT || world[y][x] === TileType.STONE) {
                const noiseVal = (caveNoise.noise2D(x * caveFreq, y * caveFreq) + 1) / 2;
                if (noiseVal > caveThreshold) {
                    world[y][x] = TileType.SKY;
                }
            }
        }
    }
    
    // 3. Water Simulation
    const waterSpawnPoints = Math.floor(gridWidth * gridHeight * (waterAmount / 10000));
    for (let i = 0; i < waterSpawnPoints; i++) {
        const spawnX = Math.floor(prng() * gridWidth);
        const spawnY = Math.floor(prng() * (gridHeight - surfaceLevel)) + Math.floor(surfaceLevel) - 20;

        if (spawnY >= gridHeight || spawnY < 0 || spawnX < 0 || spawnX >= gridWidth) continue;

        if (world[spawnY][spawnX] === TileType.DIRT || world[spawnY][spawnX] === TileType.STONE) {
           // Find an air pocket to spawn in
           let airY = -1;
           for(let j = spawnY; j > 0; j--) {
               if(world[j][spawnX] === TileType.SKY) {
                   airY = j;
                   break;
               }
           }
           if (airY !== -1) {
                simulateWaterFlow(world, spawnX, airY, gridWidth, gridHeight);
           }
        }
    }
    
    return world;
};

function simulateWaterFlow(world: TileType[][], startX: number, startY: number, width: number, height: number) {
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);
    let waterPlaced = 0;
    const maxWater = 5000;

    while (queue.length > 0 && waterPlaced < maxWater) {
        const [x, y] = queue.shift()!;
        
        if (world[y][x] === TileType.SKY) {
            world[y][x] = TileType.WATER;
            waterPlaced++;
        }

        // Flow down
        const down: [number, number] = [x, y + 1];
        if (isValid(down, width, height) && !visited.has(`${down[0]},${down[1]}`) && world[down[1]][down[0]] === TileType.SKY) {
            visited.add(`${down[0]},${down[1]}`);
            queue.unshift(down); // Prioritize downward flow
            continue;
        }

        // Flow sideways
        const left: [number, number] = [x - 1, y];
        if (isValid(left, width, height) && !visited.has(`${left[0]},${left[1]}`) && world[left[1]][left[0]] === TileType.SKY) {
            visited.add(`${left[0]},${left[1]}`);
            queue.push(left);
        }

        const right: [number, number] = [x + 1, y];
        if (isValid(right, width, height) && !visited.has(`${right[0]},${right[1]}`) && world[right[1]][right[0]] === TileType.SKY) {
            visited.add(`${right[0]},${right[1]}`);
            queue.push(right);
        }
    }
}

const isValid = (pos: [number, number], width: number, height: number): boolean => {
    const [x, y] = pos;
    return x >= 0 && x < width && y >= 0 && y < height;
};

// Simple seedable pseudo-random number generator
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
