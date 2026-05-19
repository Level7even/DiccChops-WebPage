// ═══════════════════════════════════════
//  STARFRONT — utils.js
// ═══════════════════════════════════════

// ── Math ──────────────────────────────
function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function distSq(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rndInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function rndFloat(lo, hi) { return Math.random() * (hi - lo) + lo; }
function rndPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function tileToWorld(tx, ty) {
    const s = CFG.TILE_SIZE;
    return { x: tx * s + s / 2, y: ty * s + s / 2 };
}

function worldToTile(wx, wy) {
    const s = CFG.TILE_SIZE;
    return { x: Math.floor(wx / s), y: Math.floor(wy / s) };
}

// ── A* Pathfinding ─────────────────────
// Returns array of world-space {x,y} waypoints, or null if unreachable.
// Includes simple path smoothing (removes unnecessary waypoints on clear LOS).
function findPath(map, sx, sy, ex, ey) {
    const ts = CFG.TILE_SIZE;
    const startT = worldToTile(sx, sy);
    const endT = worldToTile(ex, ey);

    if (!map.walkable(endT.x, endT.y)) {
        // Find nearest walkable tile to target
        const alt = map.nearestWalkable(endT.x, endT.y);
        if (!alt) return null;
        endT.x = alt.x; endT.y = alt.y;
    }

    const key = (x, y) => (x << 8) | y;  // works for maps < 256 wide
    const heur = (x, y) => Math.abs(x - endT.x) + Math.abs(y - endT.y);

    // Priority queue (simple sorted array for small maps)
    const open = [];
    const gCost = new Map();
    const parent = new Map();

    const startKey = key(startT.x, startT.y);
    gCost.set(startKey, 0);
    open.push({ x: startT.x, y: startT.y, f: heur(startT.x, startT.y) });

    const DIRS = [
        [0, -1, 1], [0, 1, 1], [-1, 0, 1], [1, 0, 1],
        [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414],
    ];

    let found = false;
    let iters = 0;
    const MAX_ITERS = 2000;

    while (open.length > 0 && iters < MAX_ITERS) {
        iters++;
        open.sort((a, b) => a.f - b.f);
        const cur = open.shift();

        if (cur.x === endT.x && cur.y === endT.y) { found = true; break; }

        const curKey = key(cur.x, cur.y);
        const curG = gCost.get(curKey) ?? Infinity;

        for (const [dx, dy, cost] of DIRS) {
            const nx = cur.x + dx;
            const ny = cur.y + dy;
            if (!map.walkable(nx, ny)) continue;

            // Diagonal: don't cut corners through walls
            if (dx !== 0 && dy !== 0) {
                if (!map.walkable(cur.x + dx, cur.y) || !map.walkable(cur.x, cur.y + dy)) continue;
            }

            const nk = key(nx, ny);
            const ng = curG + cost;
            if (ng >= (gCost.get(nk) ?? Infinity)) continue;

            gCost.set(nk, ng);
            parent.set(nk, curKey);
            open.push({ x: nx, y: ny, f: ng + heur(nx, ny) });
        }
    }

    if (!found) return null;

    // Reconstruct tile path
    const tilePath = [];
    let cur = key(endT.x, endT.y);
    const start = key(startT.x, startT.y);
    while (cur !== start) {
        const tx = (cur >> 8) & 0xFF;
        const ty = cur & 0xFF;
        tilePath.unshift({ x: tx, y: ty });
        cur = parent.get(cur);
        if (!cur && cur !== 0) break;
    }

    // Convert to world space
    return tilePath.map(t => tileToWorld(t.x, t.y));
}

// ── DOM Helpers ────────────────────────
function el(id) { return document.getElementById(id); }

function notify(msg, type = '') {
    const container = el('notifications');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `notif ${type}`;
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2600);
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Unique incremental ID
let _uid = 1;
function nextId() { return _uid++; }
function resetIds() { _uid = 1; }

// Canvas drawing helpers
function drawRoundRect(ctx, x, y, w, h, r = 3) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}