// ═══════════════════════════════════════
//  STARFRONT — game.js
//  Game class: world state + main loop
// ═══════════════════════════════════════

class Game {
    constructor(canvas, mmCanvas) {
        this.canvas = canvas;
        this.mmCanvas = mmCanvas;
        this.viewW = canvas.width;
        this.viewH = canvas.height;

        this.camera = { x: 0, y: 0, zoom: 1 };
        this.running = false;
        this.lastTime = 0;

        this.entities = [];
        this.selection = [];

        this._init();
    }

    _init() {
        resetIds();
        this.map = new GameMap(CFG.MAP_W, CFG.MAP_H);
        this.economy = new Economy();
        this.renderer = new Renderer(this.canvas, this.mmCanvas);
        this.input = new InputManager(this.canvas, this);
        this.ai = new EnemyAI(this);

        this.entities = [];
        this.selection = [];

        // Player base — bottom-left
        const pcx = 5;
        const pcy = CFG.MAP_H - 8;
        this._clearArea(pcx - 1, pcy - 1, 6, 6);
        const cc = this.placeBuilding('command_center', pcx, pcy, 0);
        cc.constructing = false;
        cc.buildProgress = 1;
        cc.hp = cc.def.hp;

        // Starter workers
        for (let i = 0; i < 3; i++) {
            this.spawnUnit('worker', 0, cc.x - 40 + i * 25, cc.y + cc.pixelH / 2 + 30);
        }

        // Enemy base — top-right (just a CC for visual)
        const ecx = CFG.MAP_W - 8;
        const ecy = 5;
        this._clearArea(ecx - 1, ecy - 1, 6, 6);
        const ec = this.placeBuilding('command_center', ecx, ecy, 1);
        ec.constructing = false;
        ec.buildProgress = 1;
        ec.hp = ec.def.hp;

        // Center camera on player base
        this.camera.x = clamp(cc.x - this.viewW / 2, 0, CFG.MAP_W * CFG.TILE_SIZE - this.viewW);
        this.camera.y = clamp(cc.y - this.viewH / 2, 0, CFG.MAP_H * CFG.TILE_SIZE - this.viewH);

        this.economy.recalcProvided(this.entities);
        this.updateHUD();
    }

    _clearArea(tx, ty, w, h) {
        for (let y = ty; y < ty + h; y++) {
            for (let x = tx; x < tx + w; x++) {
                if (x < 0 || y < 0 || x >= CFG.MAP_W || y >= CFG.MAP_H) continue;
                const t = this.map.getTile(x, y);
                if (t === CFG.T.ROCK || t === CFG.T.WATER) this.map.setTile(x, y, CFG.T.GRASS);
            }
        }
    }

    // ── Entity helpers ──────────────
    spawnUnit(type, team, x, y) {
        const def = CFG.UNITS[type];
        if (!def) return null;
        const u = new Unit(type, team, x, y);
        u.team = team;
        this.entities.push(u);
        return u;
    }

    placeBuilding(type, tileX, tileY, team) {
        const def = CFG.BUILDINGS[type];
        if (!def) return null;
        const b = new Building(type, team, tileX, tileY);
        b.team = team;
        this.map.occupyBuilding(tileX, tileY, def.tileSize, true);
        this.entities.push(b);
        return b;
    }

    entityAt(wx, wy, team) {
        // Buildings first (larger hit target)
        for (const e of this.entities) {
            if (e.dead) continue;
            if (team !== undefined && team !== null && e.team !== team) continue;
            if (e.isBuilding()) {
                if (wx >= e.x - e.pixelW / 2 && wx <= e.x + e.pixelW / 2
                    && wy >= e.y - e.pixelH / 2 && wy <= e.y + e.pixelH / 2) return e;
            }
        }
        // Then units
        let best = null, bestD = Infinity;
        for (const e of this.entities) {
            if (e.dead || !e.isUnit()) continue;
            if (team !== undefined && team !== null && e.team !== team) continue;
            const d = dist(wx, wy, e.x, e.y);
            if (d <= e.radius + 4 && d < bestD) { best = e; bestD = d; }
        }
        return best;
    }

    spawnClickFX(wx, wy, kind) {
        const color = kind === 'attack' ? '#ff3355' : '#00e5ff';
        this.renderer.addFX({ type: 'click', x: wx, y: wy, color, duration: 0.35 });
    }

    // ── Loop ──────────────────────
    start() {
        this.running = true;
        this.lastTime = performance.now();
        const loop = (t) => {
            if (!this.running) return;
            let dt = (t - this.lastTime) / 1000;
            this.lastTime = t;
            if (dt > 0.1) dt = 0.1; // clamp huge frames
            this.update(dt);
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stop() { this.running = false; }

    update(dt) {
        this.input.update(dt);

        // Update entities
        for (const e of this.entities) {
            if (e.dead) continue;
            e.update(dt, this);
        }

        // Remove corpses; release building footprints
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            if (!e.dead) continue;
            if (e.isBuilding()) {
                this.map.occupyBuilding(e.tileX, e.tileY, e.def.tileSize, false);
            }
            // remove from selection
            const sIdx = this.selection.indexOf(e);
            if (sIdx >= 0) this.selection.splice(sIdx, 1);
            this.entities.splice(i, 1);
        }

        this.ai.update(dt);
        this.economy.recalcProvided(this.entities);
        this.economy.updateHUD();

        // Win/lose conditions
        const playerCC = this.entities.find(e => e.type === 'command_center' && e.team === 0 && !e.dead);
        const enemyCC = this.entities.find(e => e.type === 'command_center' && e.team === 1 && !e.dead);
        if (!playerCC) this._endGame(false);
        else if (!enemyCC && this.ai.waveNumber > 0) {
            // never auto-win — enemy CC stays. Skip.
        }

        // Refresh HUD panel each frame if selection state changed
        this.updateHUD();
    }

    render() {
        this.renderer.render(this, this.input);
    }

    // ── HUD info panel ─────────────
    updateHUD() {
        const name = el('panel-name');
        const portrait = el('portrait-icon');
        const hpFill = el('panel-hp-fill');
        const hpText = el('panel-hp-text');
        const stats = el('panel-stats');
        const actions = el('actions-grid');
        if (!name) return;

        const sel = this.selection.filter(e => !e.dead);

        if (sel.length === 0) {
            name.textContent = 'NOTHING SELECTED';
            portrait.textContent = '—';
            hpFill.style.width = '0%';
            hpText.textContent = '';
            stats.innerHTML = '';
            actions.innerHTML = '';
            return;
        }

        const first = sel[0];
        const def = first.def;
        if (sel.length === 1) {
            name.textContent = def.name.toUpperCase();
        } else {
            name.textContent = `${sel.length}× ${def.name.toUpperCase()}`;
        }
        portrait.textContent = def.icon;
        hpFill.style.width = `${first.hpFrac * 100}%`;
        hpText.textContent = `${Math.ceil(first.hp)} / ${first.hpMax}`;

        // Stats
        let html = '';
        if (first.isUnit()) {
            html += `<div>DMG ${def.damage}</div>`;
            html += `<div>RNG ${def.range}</div>`;
            html += `<div>SPD ${def.speed}</div>`;
            if (first.type === 'worker' && first.carrying > 0) {
                html += `<div style="color:#ffd700">CARRY ${first.carrying}◈</div>`;
            }
        } else {
            if (first.constructing) {
                html += `<div>BUILDING ${(first.buildProgress * 100).toFixed(0)}%</div>`;
            }
            if (def.trains && def.trains.length > 0 && first.trainQueue.length > 0) {
                html += `<div>QUEUE ${first.trainQueue.length}</div>`;
            }
            if (def.provides?.energy) html += `<div>+${def.provides.energy} PWR</div>`;
            if (def.provides?.supply) html += `<div>+${def.provides.supply} UNITS</div>`;
        }
        stats.innerHTML = html;

        // Actions
        this._buildActions(actions, sel);
    }

    _buildActions(grid, sel) {
        grid.innerHTML = '';
        const first = sel[0];

        // If a building of own team selected
        if (first.team === 0 && first.isBuilding() && !first.constructing) {
            // Training buttons
            for (const ut of first.def.trains || []) {
                const udef = CFG.UNITS[ut];
                grid.appendChild(this._actionBtn(udef.icon, udef.name,
                    `${udef.cost?.credits || 0}◈`, () => {
                        if (!this.economy.canAfford(udef.cost)) {
                            notify('Insufficient credits!', 'warn'); return;
                        }
                        if (this.economy.supplyUsed + (udef.supplyUse || 0) > this.economy.supplyMax) {
                            notify('Supply cap reached!', 'warn'); return;
                        }
                        this.economy.spend(udef.cost);
                        first.queueTrain(ut);
                    }));
            }
        }

        // If a worker selected → show build options
        if (first.team === 0 && first.isUnit() && first.type === 'worker') {
            const builds = ['barracks', 'factory', 'power_gen', 'turret', 'wall'];
            for (const bt of builds) {
                const bdef = CFG.BUILDINGS[bt];
                grid.appendChild(this._actionBtn(bdef.icon, bdef.name,
                    `${bdef.cost?.credits || 0}◈`, () => {
                        this.input.enterBuildMode(bt);
                        notify(`Placing ${bdef.name}…`);
                    }));
            }
        }
    }

    _actionBtn(icon, label, sub, onClick) {
        const div = document.createElement('div');
        div.className = 'action-btn';
        div.innerHTML = `<div class="btn-icon">${icon}</div>
            <div class="btn-label">${label}</div>
            <div class="btn-cost">${sub}</div>`;
        div.onclick = onClick;
        return div;
    }

    _endGame(won) {
        if (this._ended) return;
        this._ended = true;
        this.running = false;
        const ov = el('overlay');
        const t = el('overlay-title');
        const s = el('overlay-sub');
        if (ov) ov.style.display = 'flex';
        if (t) t.textContent = won ? 'VICTORY' : 'DEFEAT';
        if (s) s.textContent = won
            ? `Cleared ${this.ai.waveNumber} waves.`
            : `Survived ${this.ai.waveNumber} waves.`;
    }

    restart() {
        this.stop();
        const ov = el('overlay');
        if (ov) ov.style.display = 'none';
        this._ended = false;
        this._init();
        this.start();
    }

    resize(w, h) {
        this.viewW = w;
        this.viewH = h;
        this.renderer.resize(w, h);
    }
}
