// ═══════════════════════════════════════
//  STARFRONT — renderer.js
//  All canvas drawing logic
// ═══════════════════════════════════════

class Renderer {
    constructor(canvas, mmCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mmCanvas = mmCanvas;
        this.mmCtx = mmCanvas.getContext('2d');

        this.fxList = [];  // visual effects pool
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
    }

    // ── Main Render ──────────────────────
    render(game, input) {
        const ctx = this.ctx;
        const cam = game.camera;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Apply camera transform
        ctx.save();
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);

        this._drawMap(ctx, game.map, cam, W, H, cam.zoom);
        this._drawCrystals(ctx, game.map);
        this._drawBuildings(ctx, game.entities, game);
        this._drawUnits(ctx, game.entities);
        this._drawFX(ctx, this.fxList, 1 / 60); // pass approximate dt
        this._drawSelectionCircles(ctx, game.selection);

        ctx.restore();

        // Screen-space overlays
        this._drawDragRect(ctx, input.dragRect);
        this._drawBuildGhost(ctx, input, game, cam);

        this._renderMinimap(game);
    }

    // ── Tilemap ──────────────────────────
    _drawMap(ctx, map, cam, W, H, zoom) {
        const ts = CFG.TILE_SIZE;
        const col = CFG.COLORS;

        // Visible tile range
        const x0 = Math.max(0, Math.floor(cam.x / ts));
        const y0 = Math.max(0, Math.floor(cam.y / ts));
        const x1 = Math.min(map.width - 1, Math.ceil((cam.x + W / zoom) / ts));
        const y1 = Math.min(map.height - 1, Math.ceil((cam.y + H / zoom) / ts));

        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const t = map.getTile(tx, ty);
                const px = tx * ts;
                const py = ty * ts;

                // Checkerboard grass variation
                let c;
                switch (t) {
                    case CFG.T.GRASS:
                        c = (tx + ty) % 2 === 0 ? col.GRASS : col.GRASS2;
                        break;
                    case CFG.T.ROCK: c = col.ROCK; break;
                    case CFG.T.WATER: c = col.WATER; break;
                    case CFG.T.CRYSTAL: c = col.CRYSTAL; break;
                    default: c = col.GRASS;
                }

                ctx.fillStyle = c;
                ctx.fillRect(px, py, ts, ts);

                // Rock texture dots
                if (t === CFG.T.ROCK) {
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                    ctx.fillRect(px + 4, py + 4, 6, 6);
                    ctx.fillRect(px + ts - 10, py + ts - 10, 6, 6);
                }

                // Water shimmer
                if (t === CFG.T.WATER) {
                    ctx.fillStyle = 'rgba(0, 80, 180, 0.25)';
                    ctx.fillRect(px, py, ts, ts);
                }

                // Grid line
                ctx.strokeStyle = col.GRID;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, ts, ts);
            }
        }
    }

    // ── Crystal Nodes ────────────────────
    _drawCrystals(ctx, map) {
        const t = performance.now() / 1000;
        for (const node of map.crystalNodes) {
            if (node.credits <= 0) continue;
            const r = 14;
            const pct = node.credits / node.maxCredits;

            // Glow
            const grd = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, r * 2.5);
            grd.addColorStop(0, `rgba(0,255,180,${0.35 * pct})`);
            grd.addColorStop(1, 'rgba(0,255,180,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Crystals — draw 3–5 spikes
            const count = Math.ceil(pct * 5);
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2 + t * 0.4;
                const cr = 8 + Math.sin(t * 1.5 + i) * 2;
                const cx = node.x + Math.cos(ang) * 8;
                const cy = node.y + Math.sin(ang) * 8;
                ctx.beginPath();
                ctx.moveTo(cx, cy - cr);
                ctx.lineTo(cx + 4, cy + 4);
                ctx.lineTo(cx - 4, cy + 4);
                ctx.closePath();
                ctx.fillStyle = `rgba(0,255,180,${0.7 + Math.sin(t + i) * 0.3})`;
                ctx.fill();
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Credits label
            ctx.fillStyle = 'rgba(0,255,200,0.7)';
            ctx.font = '9px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.fillText(Math.ceil(node.credits), node.x, node.y + r + 14);
        }
    }

    // ── Buildings ────────────────────────
    _drawBuildings(ctx, entities, game) {
        const ts = CFG.TILE_SIZE;

        for (const ent of entities) {
            if (!ent.isBuilding() || ent.dead) continue;
            const b = ent;
            const def = b.def;
            const sz = b.pixelW;
            const bx = b.x - sz / 2;
            const by = b.y - sz / 2;

            const teamColor = b.team === 0 ? def.color : CFG.COLORS.ENEMY;
            const darkColor = b.team === 0 ? def.dark : CFG.COLORS.ENEMY_DARK;

            ctx.save();

            // Construction overlay
            if (b.constructing) {
                ctx.globalAlpha = 0.35 + b.buildProgress * 0.65;
            }

            // Hit flash
            if (b.flash > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(bx - 2, by - 2, sz + 4, sz + 4);
            }

            // Body
            ctx.fillStyle = darkColor;
            ctx.fillRect(bx, by, sz, sz);

            // Border
            ctx.strokeStyle = b.selected ? '#ffffff' : teamColor;
            ctx.lineWidth = b.selected ? 2.5 : 1.5;
            ctx.strokeRect(bx, by, sz, sz);

            // Inner detail — cross pattern
            ctx.strokeStyle = `${teamColor}55`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(bx + sz / 2, by + 4);
            ctx.lineTo(bx + sz / 2, by + sz - 4);
            ctx.moveTo(bx + 4, by + sz / 2);
            ctx.lineTo(bx + sz - 4, by + sz / 2);
            ctx.stroke();

            // Pulse ring for powered buildings
            if (!b.constructing && def.provides?.energy > 0) {
                const r = sz * 0.4 + Math.sin(b.pulse) * 3;
                ctx.beginPath();
                ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,204,0,${0.2 + Math.sin(b.pulse) * 0.15})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Turret barrel
            if (b.type === 'turret') {
                const angle = b.attackTarget && !b.attackTarget.dead
                    ? Math.atan2(b.attackTarget.y - b.y, b.attackTarget.x - b.x)
                    : b.pulse / 3;
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(angle);
                ctx.fillStyle = teamColor;
                ctx.fillRect(0, -4, sz / 2 - 2, 8);
                ctx.restore();
            }

            // Icon
            ctx.font = `${Math.floor(sz * 0.35)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.6;
            ctx.fillText(def.icon, b.x, b.y);
            ctx.globalAlpha = 1;
            ctx.textBaseline = 'alphabetic';

            // Construction progress bar
            if (b.constructing) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx, by + sz - 8, sz, 8);
                ctx.fillStyle = teamColor;
                ctx.fillRect(bx, by + sz - 8, sz * b.buildProgress, 8);
            }

            // Training queue bar
            if (!b.constructing && b.trainQueue.length > 0) {
                const pct = b.queueProgress;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx, by + sz - 6, sz, 6);
                ctx.fillStyle = CFG.COLORS.WORKER;
                ctx.fillRect(bx, by + sz - 6, sz * pct, 6);
            }

            // HP bar
            this._drawHPBar(ctx, bx, by - 10, sz, 5, b);

            ctx.restore();
        }
    }

    // ── Units ────────────────────────────
    _drawUnits(ctx, entities) {
        for (const ent of entities) {
            if (!ent.isUnit() || ent.dead) continue;
            const u = ent;
            const def = u.def;

            ctx.save();
            ctx.translate(u.x, u.y);

            const teamColor = u.team === 0
                ? (u.type === 'worker' ? CFG.COLORS.WORKER : CFG.COLORS.PLAYER)
                : CFG.COLORS.ENEMY;

            // Hit flash
            if (u.flash > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, u.radius + 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fill();
            }

            // Selection ring
            if (u.selected) {
                ctx.beginPath();
                ctx.arc(0, 0, u.radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = CFG.COLORS.SELECT_BORDER;
                ctx.lineWidth = 2;
                ctx.stroke();
                // Marching ants selection arc
                ctx.setLineDash([4, 4]);
                ctx.lineDashOffset = -(performance.now() / 80);
                ctx.beginPath();
                ctx.arc(0, 0, u.radius + 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0,229,255,0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Body
            ctx.beginPath();
            ctx.arc(0, 0, u.radius, 0, Math.PI * 2);

            if (u.team === 0) {
                const grd = ctx.createRadialGradient(-u.radius * 0.3, -u.radius * 0.3, 0, 0, 0, u.radius);
                grd.addColorStop(0, teamColor);
                grd.addColorStop(1, u.type === 'worker' ? '#886600' : CFG.COLORS.PLAYER_DARK);
                ctx.fillStyle = grd;
            } else {
                const grd = ctx.createRadialGradient(-u.radius * 0.3, -u.radius * 0.3, 0, 0, 0, u.radius);
                grd.addColorStop(0, teamColor);
                grd.addColorStop(1, CFG.COLORS.ENEMY_DARK);
                ctx.fillStyle = grd;
            }
            ctx.fill();
            ctx.strokeStyle = teamColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Directional pip
            ctx.beginPath();
            ctx.arc(Math.cos(u.angle) * (u.radius * 0.55), Math.sin(u.angle) * (u.radius * 0.55), 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();

            // HP bar
            ctx.restore();
            this._drawHPBar(ctx, u.x - u.radius, u.y - u.radius - 8, u.radius * 2, 3.5, u);
        }
    }

    _drawHPBar(ctx, x, y, w, h, ent) {
        const pct = ent.hpFrac;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, h);
        const hpColor = pct > 0.6 ? CFG.COLORS.HP_PLAYER
            : pct > 0.3 ? CFG.COLORS.HP_LOW
                : CFG.COLORS.HP_ENEMY;
        ctx.fillStyle = hpColor;
        ctx.fillRect(x, y, w * pct, h);
    }

    // ── Visual Effects ───────────────────
    _drawFX(ctx, fxList) {
        for (let i = fxList.length - 1; i >= 0; i--) {
            const fx = fxList[i];
            const t = performance.now() / 1000;
            const age = t - fx.born;
            const life = age / fx.duration;

            if (life >= 1) { fxList.splice(i, 1); continue; }

            if (fx.type === 'laser') {
                ctx.save();
                ctx.globalAlpha = 1 - life;
                ctx.beginPath();
                ctx.moveTo(fx.x1, fx.y1);
                ctx.lineTo(fx.x2, fx.y2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 1.5 - life * 1;
                ctx.shadowColor = fx.color;
                ctx.shadowBlur = 4;
                ctx.stroke();
                ctx.restore();
            }

            if (fx.type === 'circle') {
                ctx.save();
                ctx.globalAlpha = 1 - life;
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.radius * (0.5 + life * 1.5), 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 2 - life * 2;
                ctx.stroke();
                ctx.restore();
            }

            if (fx.type === 'click') {
                ctx.save();
                ctx.globalAlpha = 1 - life;
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, 6 + life * 14, 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    addFX(fx) {
        fx.born = performance.now() / 1000;
        this.fxList.push(fx);
    }

    // ── Drag Selection Rect ──────────────
    _drawDragRect(ctx, rect) {
        if (!rect) return;
        ctx.fillStyle = CFG.COLORS.SELECT_FILL;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = CFG.COLORS.SELECT_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    // ── Build Ghost ──────────────────────
    _drawBuildGhost(ctx, input, game, cam) {
        if (!input.buildMode) return;
        const { type } = input.buildMode;
        const def = CFG.BUILDINGS[type];
        if (!def) return;

        const ts = CFG.TILE_SIZE;
        const sz = def.tileSize;
        const mx = input.mouse.wx;
        const my = input.mouse.wy;
        const tx = Math.floor(mx / ts);
        const ty = Math.floor(my / ts);
        const ok = game.map.canPlaceBuilding(tx, ty, sz);
        const sx = (tx * ts - cam.x) * cam.zoom;
        const sy = (ty * ts - cam.y) * cam.zoom;
        const sw = sz * ts * cam.zoom;

        ctx.fillStyle = ok ? 'rgba(0,229,255,0.2)' : 'rgba(255,0,0,0.25)';
        ctx.strokeStyle = ok ? '#00e5ff' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.fillRect(sx, sy, sw, sw);
        ctx.strokeRect(sx, sy, sw, sw);
        ctx.setLineDash([]);

        ctx.font = '11px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillStyle = ok ? '#00e5ff' : '#ff4444';
        ctx.fillText(
            `${def.name} — ${def.cost?.credits ?? 0}◈`,
            sx + sw / 2,
            sy - 6
        );
    }

    // ── Minimap ──────────────────────────
    _renderMinimap(game) {
        const ctx = this.mmCtx;
        const W = this.mmCanvas.width;
        const H = this.mmCanvas.height;
        const mw = CFG.MAP_W * CFG.TILE_SIZE;
        const mh = CFG.MAP_H * CFG.TILE_SIZE;
        const sx = W / mw;
        const sy = H / mh;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#040c14';
        ctx.fillRect(0, 0, W, H);

        // Tiles (downsampled)
        for (let ty = 0; ty < CFG.MAP_H; ty++) {
            for (let tx = 0; tx < CFG.MAP_W; tx++) {
                const t = game.map.getTile(tx, ty);
                switch (t) {
                    case CFG.T.GRASS: ctx.fillStyle = '#0a1a08'; break;
                    case CFG.T.ROCK: ctx.fillStyle = '#141a22'; break;
                    case CFG.T.WATER: ctx.fillStyle = '#071522'; break;
                    case CFG.T.CRYSTAL: ctx.fillStyle = '#003322'; break;
                }
                ctx.fillRect(tx * sx, ty * sy, sx + 0.5, sy + 0.5);
            }
        }

        // Crystal nodes
        for (const node of game.map.crystalNodes) {
            if (node.credits <= 0) continue;
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(node.x * sx - 1.5, node.y * sy - 1.5, 3, 3);
        }

        // Entities
        for (const ent of game.entities) {
            if (ent.dead) continue;
            const ex = ent.x * sx;
            const ey = ent.y * sy;
            const r = ent.isBuilding() ? 3 : 1.5;
            ctx.fillStyle = ent.team === 0
                ? (ent.isBuilding() ? CFG.COLORS.PLAYER : '#00e5ff')
                : CFG.COLORS.ENEMY;
            ctx.beginPath();
            ctx.arc(ex, ey, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Viewport rect
        const cam = game.camera;
        const vx = (cam.x / mw) * W;
        const vy = (cam.y / mh) * H;
        const vw = (game.viewW / cam.zoom / mw) * W;
        const vh = (game.viewH / cam.zoom / mh) * H;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);
    }

    // ── Selection Circles ────────────────
    _drawSelectionCircles(ctx, selection) {
        for (const ent of selection) {
            if (ent.dead || !ent.isBuilding()) continue;
            // Building selection corners
            const bx = ent.x - ent.pixelW / 2 - 3;
            const by = ent.y - ent.pixelH / 2 - 3;
            const bw = ent.pixelW + 6;
            const bh = ent.pixelH + 6;
            const clen = 8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            // Corners
            const corners = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]];
            const ds = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
            corners.forEach(([cx, cy], i) => {
                const [dx, dy] = ds[i];
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + dx * clen, cy);
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, cy + dy * clen);
                ctx.stroke();
            });
        }
    }
}