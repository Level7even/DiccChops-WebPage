
import type { MapSettings } from '../types';

// --- Perlin Noise Implementation ---
const P = new Array(512);
const permutation = [ 151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136, 171,168,68,175,74,165,77,119,191,254,73,196,134,5,250,83,17,44,121,116,86,4,107,176,150,230,128,154, 178,48,9,166,122,109,19,126,118,135,112,163,161,195,162,130,210,185,244,127,105,85,147,214,236,251, 70,235,141,173,229,143,213,245,16,79,159,42,43,189,2,204,180,198,167,61,255,164,181,183,108,123,231, 207,49,172,139,22,138,58,187,206,205,67,25,113,248,104,72,129,242,101,31,179,199,14,51,64,24,145,208, 223,133,184,209,98,158,243,12,38,132,188,241,192,253,186,170,25,249,55,102,152,82,60,227,106,193,45, 124,182,157,115,228,246,25,153,66,78,81,111,16,169,16,211,47,12,25,65,71,202,18,39,170,25,226,34,50, 238,200,76,146,1,216,84,156,70,144,3,218,63,221,170,155,2,217,93,16,110,97,222,89,16,215,92,16,52, 54,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16, 16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16 ];
(function initPerlin() { for (let i = 0; i < 256; i++) { P[i] = P[i + 256] = permutation[i]; } })();
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) { const h = hash & 15; const u = h < 8 ? x : y; const v = h < 4 ? y : h === 12 || h === 14 ? x : 0; return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); }
function perlin2D(x: number, y: number) { let X = Math.floor(x) & 255; let Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); let u = fade(x); let v = fade(y); let A = P[X] + Y; let B = P[X + 1] + Y; let val = lerp(lerp(grad(P[P[A]], x, y), grad(P[P[B]], x - 1, y), u), lerp(grad(P[P[A + 1]], x, y - 1), grad(P[P[B + 1]], x - 1, y - 1), u), v); return (val + 1) / 2; }
// --- End Perlin Noise Implementation ---

export function generateMap(canvas: HTMLCanvasElement, settings: MapSettings) {
    const { width: w, height: h, baseHeightFactor, smoothPasses, sin1Amp, sin1Freq, sin2Amp, sin2Freq, sin3Amp, sin3Freq, sin4Amp, sin4Freq, randomAmp, grassThickness, dirtLayerDepth, caveDensity, caveSize, caveVerticalBias, caveVerticalFreq } = settings;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = w;
    canvas.height = h;

    // --- Generate heightmap ---
    const heights = new Array(w);
    const baseHeight = h * baseHeightFactor;
    for (let x = 0; x < w; x++) {
        heights[x] = baseHeight + Math.sin(x * sin1Freq) * sin1Amp + Math.sin(x * sin2Freq) * sin2Amp + Math.sin(x * sin3Freq) * sin3Amp + Math.sin(x * sin4Freq) * sin4Amp + (Math.random() - 0.5) * 2 * randomAmp;
    }

    // --- Smooth heightmap ---
    for (let pass = 0; pass < smoothPasses; pass++) {
        for (let i = 1; i < w - 1; i++) {
            heights[i] = (heights[i - 1] + heights[i] + heights[i + 1]) / 3;
        }
    }

    // --- Generate terrain (solid first) ---
    // Cell types: 0 = Air, 1 = Solid, 2 = Water
    const mapCells = Array(h).fill(0).map(() => Array(w).fill(0));
    for (let x = 0; x < w; x++) {
        const groundY = Math.floor(h - heights[x]);
        for (let y = groundY; y < h; y++) {
            if (y >= 0) mapCells[y][x] = 1;
        }
    }

    // --- Generate Caves ---
    const caveNoiseSeedX = Math.random() * 10000;
    const caveNoiseSeedY = Math.random() * 10000;
    const caveScaleFactor = 0.01 * (200 / caveSize);
    const caveNoiseThreshold = caveDensity / 100;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const groundYForColumn = Math.floor(h - heights[x]);
            if (mapCells[y][x] === 1 && y > groundYForColumn + grassThickness + dirtLayerDepth) {
                const noiseVal = perlin2D(x * caveScaleFactor + caveNoiseSeedX, y * caveScaleFactor + caveNoiseSeedY);
                const currentVerticalBias = Math.sin(y * caveVerticalFreq) * caveVerticalBias * 0.5 + (caveVerticalBias * 0.5);
                const finalCaveThreshold = caveNoiseThreshold - currentVerticalBias;
                if (noiseVal < finalCaveThreshold) {
                    mapCells[y][x] = 0; // Carve cave
                }
            }
        }
    }
    
    // --- Fill pools and lakes ---
    for (let y = h - 2; y >= 0; y--) {
        for (let x = 1; x < w - 1; x++) {
            if (mapCells[y][x] === 0 && (mapCells[y + 1][x] === 1 || mapCells[y + 1][x] === 2)) {
                let hasLeftWall = false;
                for (let i = x - 1; i >= 0; i--) {
                    if (mapCells[y][i] === 1) { hasLeftWall = true; break; }
                }

                if (hasLeftWall) {
                    let hasRightWall = false;
                    for (let i = x + 1; i < w; i++) {
                        if (mapCells[y][i] === 1) { hasRightWall = true; break; }
                    }
                    if (hasRightWall) {
                        mapCells[y][x] = 2; // Fill with water
                    }
                }
            }
        }
    }

    // --- Draw map ---
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    const mixNoiseScale = 0.03;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const index = (y * w + x) * 4;
            let r = 0, g = 0, b = 0;
            const cellType = mapCells[y][x];
            const groundYForColumn = Math.floor(h - heights[x]);

            if (cellType === 1) { // Solid Ground
                if (y >= groundYForColumn && y < groundYForColumn + grassThickness) {
                    r = 34; g = 139; b = 34; // Grass
                } else if (y >= groundYForColumn + grassThickness && y < groundYForColumn + grassThickness + dirtLayerDepth) {
                    r = 139; g = 69; b = 19; // Dirt
                } else {
                    const stoneColor = 100 + Math.floor(perlin2D(x * mixNoiseScale, y * mixNoiseScale) * 50);
                    r = g = b = stoneColor; // Stone
                }
            } else if (cellType === 2) { // Water
                r = 30; g = 144; b = 255; // Dodger Blue
            } else { // Air
                const skyBlue = 150 + Math.floor((h - y) / h * 105);
                r = Math.min(255, 200 + Math.floor(y / h * 55));
                g = Math.min(255, skyBlue);
                b = Math.min(255, skyBlue + 50);
            }

            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}
