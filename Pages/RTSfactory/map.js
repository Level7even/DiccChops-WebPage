// ═══════════════════════════════════════
//  STARFRONT — map.js
//  Procedural map generation + queries
// ═══════════════════════════════════════

class GameMap {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.tiles = new Uint8Array(w * h);    // tile type
        this.solid = new Uint8Array(w * h);    // 1 = blocked by building
        this.crystalNodes = [];   // {x, y, credits} resource nodes
        this._generate();
    }

    // ── Map Generation ──────────────────
    _generate() {
        const { T } = CFG;
        const W = this.width, H = this.height;

        // Fill with grass variants
        for (let i = 0; i < W * H; i++) this.tiles[i] = T.GRASS;

        // Rock clusters — several random walks
        for (let c = 0; c < 18; c++) {
            let x = rndInt(2, W - 3);
            let y = rndInt(2, H - 3);
            // Keep rocks away from player start (bottom-left) and enemy start (top-right)
            if (x < 8 && y > H - 9) continue;
            if (x > W - 9 && y < 8) continue;
            const size = rndInt(4, 12);
            for (let s = 0; s < size; s++) {
                if (x < 1 || y < 1 || x > W - 2 || y > H - 2) break;
                this.setTile(x, y, T.ROCK);
                this.setTile(x + 1, y, T.ROCK);
                this.setTile(x, y + 1, T.ROCK);
                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const d = rndPick(dirs);
                x += d[0]; y += d[1];
            }
        }

        // Water patches
        for (let c = 0; c < 6; c++) {
            const cx = rndInt(8, W - 9);
            const cy = rndInt(8, H - 9);
            const r = rndInt(2, 4);
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (dx * dx + dy * dy <= r * r) {
                        this.setTile(cx + dx, cy + dy, T.WATER);
                    }
                }
            }
        }

        // Crystal nodes — spread around map, not in player/enemy bases
        const crystalPositions = [
            { x: 14, y: H - 12 }, { x: 8, y: H - 18 },
            { x: 20, y: H - 8 }, { x: W - 14, y: 12 },
            { x: W - 8, y: 18 }, { x: W / 2 | 0, y: H / 2 | 0 },
            { x: 6, y: H / 2 | 0 }, { x: W - 6, y: H / 2 | 0 },
        ];

        for (const cp of crystalPositions) {
            const cx = clamp(cp.x, 2, W - 3);
            const cy = clamp(cp.y, 2, H - 3);
            // Clear a small area for the crystal field
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.getTile(cx + dx, cy + dy) !== T.WATER) {
                        this.setTile(cx + dx, cy + dy, T.CRYSTAL);
                    }
                }
            }
            const tw = tileToWorld(cx, cy);
            this.crystalNodes.push({ x: tw.x, y: tw.y, credits: CFG.CRYSTAL_MAX, maxCredits: CFG.CRYSTAL_MAX, id: nextId() });
        }
    }

    // ── Tile Access ─────────────────────
    idx(x, y) { return y * this.width + x; }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return CFG.T.ROCK;
        return this.tiles[this.idx(x, y)];
    }

    setTile(x, y, type) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        this.tiles[this.idx(x, y)] = type;
    }

    setSolid(x, y, val) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        this.solid[this.idx(x, y)] = val ? 1 : 0;
    }

    isSolid(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
        return this.solid[this.idx(x, y)] === 1;
    }

    walkable(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
        const t = this.getTile(x, y);
        if (t === CFG.T.ROCK || t === CFG.T.WATER) return false;
        if (this.isSolid(x, y)) return false;
        return true;
    }

    // Find nearest walkable tile to given tile coords
    nearestWalkable(tx, ty) {
        for (let r = 1; r < 8; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    if (this.walkable(tx + dx, ty + dy)) {
                        return { x: tx + dx, y: ty + dy };
                    }
                }
            }
        }
        return null;
    }

    // Check if a building footprint (tileSize×tileSize) fits at tile (tx,ty)
    canPlaceBuilding(tx, ty, tileSize) {
        for (let dy = 0; dy < tileSize; dy++) {
            for (let dx = 0; dx < tileSize; dx++) {
                const t = this.getTile(tx + dx, ty + dy);
                if (t === CFG.T.ROCK || t === CFG.T.WATER) return false;
                if (this.isSolid(tx + dx, ty + dy)) return false;
            }
        }
        return true;
    }

    // Mark/unmark building footprint as solid
    occupyBuilding(tx, ty, tileSize, occupy = true) {
        for (let dy = 0; dy < tileSize; dy++) {
            for (let dx = 0; dx < tileSize; dx++) {
                this.setSolid(tx + dx, ty + dy, occupy);
            }
        }
    }

    // Get crystal node near world position (within radius pixels)
    getCrystalNear(wx, wy, radius = 120) {
        let best = null, bestD = Infinity;
        for (const node of this.crystalNodes) {
            if (node.credits <= 0) continue;
            const d = dist(wx, wy, node.x, node.y);
            if (d < radius && d < bestD) { best = node; bestD = d; }
        }
        return best;
    }
}