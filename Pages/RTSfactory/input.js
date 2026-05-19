// ═══════════════════════════════════════
//  STARFRONT — input.js
//  Mouse, keyboard, selection, build mode
// ═══════════════════════════════════════

class InputManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;

        // Mouse state
        this.mouse = { x: 0, y: 0, wx: 0, wy: 0 };  // screen + world
        this.dragStart = null;    // {x,y} screen coords where drag began
        this.isDragging = false;
        this.DRAG_THRESHOLD = 6;

        // Keyboard
        this.keys = {};

        // Build mode: null or { type: 'barracks', ... }
        this.buildMode = null;

        this._bind();
    }

    _bind() {
        const c = this.canvas;

        c.addEventListener('mousemove', e => this._onMouseMove(e));
        c.addEventListener('mousedown', e => this._onMouseDown(e));
        c.addEventListener('mouseup', e => this._onMouseUp(e));
        c.addEventListener('contextmenu', e => { e.preventDefault(); this._onRightClick(e); });
        c.addEventListener('wheel', e => this._onWheel(e), { passive: false });

        // Minimap click
        const mm = document.getElementById('minimap-canvas');
        if (mm) mm.addEventListener('mousedown', e => this._onMinimapClick(e));

        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup', e => { this.keys[e.code] = false; });
    }

    // ── Screen ↔ World conversion ────────
    screenToWorld(sx, sy) {
        const cam = this.game.camera;
        return {
            x: (sx / cam.zoom) + cam.x,
            y: (sy / cam.zoom) + cam.y,
        };
    }

    _updateMouseWorld(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        const w = this.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.wx = w.x;
        this.mouse.wy = w.y;
    }

    // ── Mouse Events ─────────────────────
    _onMouseMove(e) {
        this._updateMouseWorld(e);
    }

    _onMouseDown(e) {
        if (e.button !== 0) return;
        this._updateMouseWorld(e);

        if (this.buildMode) {
            this._tryPlaceBuilding();
            return;
        }

        this.dragStart = { x: this.mouse.x, y: this.mouse.y };
        this.isDragging = false;
    }

    _onMouseUp(e) {
        if (e.button !== 0) return;
        this._updateMouseWorld(e);

        if (this.buildMode) return;

        if (this.isDragging && this.dragStart) {
            // Box select
            this._boxSelect();
        } else {
            // Single click select
            this._clickSelect(e.shiftKey);
        }

        this.dragStart = null;
        this.isDragging = false;
    }

    _onRightClick(e) {
        this._updateMouseWorld(e);

        if (this.buildMode) {
            this.cancelBuild();
            return;
        }

        const selected = this.game.selection;
        if (selected.length === 0) return;

        const wx = this.mouse.wx;
        const wy = this.mouse.wy;

        // Check if right-clicking on an enemy → attack
        const enemy = this.game.entityAt(wx, wy, 1);
        if (enemy && !enemy.dead) {
            for (const ent of selected) {
                if (ent.isUnit() && ent.team === 0) {
                    ent.commandAttack(enemy, this.game);
                }
            }
            this.game.spawnClickFX(wx, wy, 'attack');
            return;
        }

        // Check if right-clicking on a crystal node → harvest (workers)
        const node = this.game.map.getCrystalNear(wx, wy, 60);
        if (node && node.credits > 0) {
            for (const ent of selected) {
                if (ent.isUnit() && ent.type === 'worker' && ent.team === 0) {
                    ent.commandHarvest(node, this.game);
                }
            }
            return;
        }

        // Move command — spread units out a bit
        const units = selected.filter(e => e.isUnit() && e.team === 0);
        units.forEach((u, i) => {
            const spread = units.length > 1 ? 24 : 0;
            const angle = (i / units.length) * Math.PI * 2;
            const tx = wx + Math.cos(angle) * spread;
            const ty = wy + Math.sin(angle) * spread;
            u.commandMove(tx, ty, this.game);
        });

        if (units.length > 0) this.game.spawnClickFX(wx, wy, 'move');
    }

    _onWheel(e) {
        e.preventDefault();
        const cam = this.game.camera;
        const delta = e.deltaY > 0 ? -CFG.ZOOM_STEP : CFG.ZOOM_STEP;
        cam.zoom = clamp(cam.zoom + delta, CFG.ZOOM_MIN, CFG.ZOOM_MAX);
    }

    // ── Selection ────────────────────────
    _clickSelect(additive) {
        const ent = this.game.entityAt(this.mouse.wx, this.mouse.wy, 0);

        if (!additive) {
            for (const e of this.game.selection) e.selected = false;
            this.game.selection = [];
        }

        if (ent && !ent.dead) {
            ent.selected = true;
            if (!this.game.selection.includes(ent)) {
                this.game.selection.push(ent);
            }
        }

        this.game.updateHUD();
    }

    _boxSelect() {
        if (!this.dragStart) return;
        const x1 = Math.min(this.dragStart.x, this.mouse.x);
        const y1 = Math.min(this.dragStart.y, this.mouse.y);
        const x2 = Math.max(this.dragStart.x, this.mouse.x);
        const y2 = Math.max(this.dragStart.y, this.mouse.y);

        for (const e of this.game.selection) e.selected = false;
        this.game.selection = [];

        // Convert to world coords
        const cam = this.game.camera;
        const wx1 = x1 / cam.zoom + cam.x;
        const wy1 = y1 / cam.zoom + cam.y;
        const wx2 = x2 / cam.zoom + cam.x;
        const wy2 = y2 / cam.zoom + cam.y;

        for (const ent of this.game.entities) {
            if (ent.dead || ent.team !== 0) continue;
            if (ent.isBuilding()) continue; // don't box-select buildings
            if (ent.x >= wx1 && ent.x <= wx2 && ent.y >= wy1 && ent.y <= wy2) {
                ent.selected = true;
                this.game.selection.push(ent);
            }
        }

        this.game.updateHUD();
    }

    // ── Build Mode ───────────────────────
    enterBuildMode(type) {
        this.buildMode = { type };
    }

    cancelBuild() {
        this.buildMode = null;
        notify('Build cancelled.');
    }

    _tryPlaceBuilding() {
        if (!this.buildMode) return;
        const { type } = this.buildMode;
        const def = CFG.BUILDINGS[type];
        const ts = CFG.TILE_SIZE;
        const sz = def.tileSize;

        const tx = Math.floor(this.mouse.wx / ts);
        const ty = Math.floor(this.mouse.wy / ts);

        if (!this.game.economy.canAfford(def.cost)) {
            notify('Insufficient credits!', 'warn'); return;
        }

        if (!this.game.map.canPlaceBuilding(tx, ty, sz)) {
            notify('Cannot build here!', 'warn'); return;
        }

        // All checks passed — place it
        this.game.economy.spend(def.cost);
        this.game.placeBuilding(type, tx, ty, 0);
        this.buildMode = null; // exit build mode after one placement
    }

    // ── Minimap ──────────────────────────
    _onMinimapClick(e) {
        const mm = document.getElementById('minimap-canvas');
        const rect = mm.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const scaleX = (CFG.MAP_W * CFG.TILE_SIZE) / mm.width;
        const scaleY = (CFG.MAP_H * CFG.TILE_SIZE) / mm.height;
        const cam = this.game.camera;
        cam.x = mx * scaleX - this.game.viewW / 2;
        cam.y = my * scaleY - this.game.viewH / 2;
        cam.x = clamp(cam.x, 0, CFG.MAP_W * CFG.TILE_SIZE - this.game.viewW);
        cam.y = clamp(cam.y, 0, CFG.MAP_H * CFG.TILE_SIZE - this.game.viewH);
    }

    // ── Keyboard ─────────────────────────
    _onKeyDown(e) {
        this.keys[e.code] = true;

        if (this.buildMode) {
            if (e.code === 'Escape') { this.cancelBuild(); return; }
        }

        switch (e.code) {
            case 'Escape':
                for (const ent of this.game.selection) ent.selected = false;
                this.game.selection = [];
                this.game.updateHUD();
                break;

            case 'KeyF': // Focus on Command Center
                const cc = this.game.entities.find(e => e.type === 'command_center' && e.team === 0 && !e.dead);
                if (cc) { this.game.camera.x = cc.x - this.game.viewW / 2; this.game.camera.y = cc.y - this.game.viewH / 2; }
                break;

            // Build shortcuts (avoid WASD — those are camera pan)
            case 'KeyB': this.enterBuildMode('barracks'); break;
            case 'KeyP': this.enterBuildMode('power_gen'); break;
            case 'KeyT': this.enterBuildMode('turret'); break;
            case 'KeyV': this.enterBuildMode('wall'); break;
            case 'KeyG': this.enterBuildMode('factory'); break;

            // Select all units of same type
            case 'KeyA':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    for (const ent of this.game.selection) ent.selected = false;
                    this.game.selection = this.game.entities.filter(e => e.isUnit() && e.team === 0 && !e.dead);
                    for (const ent of this.game.selection) ent.selected = true;
                    this.game.updateHUD();
                }
                break;
        }
    }

    // ── Update (called each frame) ───────
    update(dt) {
        const cam = this.game.camera;
        const spd = CFG.CAM_SPEED * dt / cam.zoom;
        const edge = CFG.CAM_EDGE_PX;
        const W = this.game.viewW;
        const H = this.game.viewH;
        const maxX = CFG.MAP_W * CFG.TILE_SIZE - W;
        const maxY = CFG.MAP_H * CFG.TILE_SIZE - H;

        const mx = this.mouse.x, my = this.mouse.y;

        if (this.keys['ArrowLeft'] || this.keys['KeyA'] && !this._anyModifier() || mx < edge) cam.x -= spd;
        if (this.keys['ArrowRight'] || this.keys['KeyD'] && !this._anyModifier() || mx > W - edge) cam.x += spd;
        if (this.keys['ArrowUp'] || this.keys['KeyW'] && !this._anyModifier() || my < edge) cam.y -= spd;
        if (this.keys['ArrowDown'] || this.keys['KeyS'] && !this._anyModifier() || my > H - edge) cam.y += spd;

        cam.x = clamp(cam.x, 0, maxX);
        cam.y = clamp(cam.y, 0, maxY);

        // Detect drag
        if (this.dragStart) {
            const dx = this.mouse.x - this.dragStart.x;
            const dy = this.mouse.y - this.dragStart.y;
            if (Math.sqrt(dx * dx + dy * dy) > this.DRAG_THRESHOLD) {
                this.isDragging = true;
            }
        }
    }

    _anyModifier() { return this.keys['ControlLeft'] || this.keys['MetaLeft']; }

    get dragRect() {
        if (!this.isDragging || !this.dragStart) return null;
        return {
            x: Math.min(this.dragStart.x, this.mouse.x),
            y: Math.min(this.dragStart.y, this.mouse.y),
            w: Math.abs(this.mouse.x - this.dragStart.x),
            h: Math.abs(this.mouse.y - this.dragStart.y),
        };
    }
}