// ═══════════════════════════════════════
//  STARFRONT — ai.js
//  Enemy AI: wave management + unit logic
// ═══════════════════════════════════════

class EnemyAI {
    constructor(game) {
        this.game = game;
        this.waveNumber = 0;
        this.waveTimer = CFG.WAVE_INTERVAL;  // countdown to first wave
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.waveTimer -= dt;

        // Update wave HUD
        const timerEl = document.getElementById('val-wave-timer');
        if (timerEl) {
            const secs = Math.ceil(Math.max(0, this.waveTimer));
            timerEl.textContent = `${secs}s`;
            timerEl.className = 'wave-timer' + (secs <= 15 ? ' imminent' : '');
        }
        const waveEl = document.getElementById('val-wave-num');
        if (waveEl) waveEl.textContent = this.waveNumber + 1;

        if (this.waveTimer <= 0) {
            this._spawnWave();
            this.waveTimer = CFG.WAVE_INTERVAL;
        }

        // Update all enemy units
        for (const ent of this.game.entities) {
            if (ent.dead || ent.team !== 1 || !ent.isUnit()) continue;
            this._updateEnemyUnit(ent, dt);
        }
    }

    _spawnWave() {
        this.waveNumber++;
        const count = Math.floor(CFG.WAVE_BASE_COUNT * Math.pow(CFG.WAVE_SCALE, this.waveNumber - 1));

        // Spawn from top-right corner area
        const map = this.game.map;
        const spawnArea = {
            x: (CFG.MAP_W - 6) * CFG.TILE_SIZE,
            y: 3 * CFG.TILE_SIZE,
        };

        // Wave composition: more varied as waves progress
        const types = this._waveComposition();

        notify(`⚠ WAVE ${this.waveNumber} INCOMING — ${count} hostiles`, 'alert');

        for (let i = 0; i < count; i++) {
            const type = rndPick(types);
            const angle = rndFloat(0, Math.PI * 2);
            const rad = rndFloat(20, 80);
            const sx = clamp(spawnArea.x + Math.cos(angle) * rad, CFG.TILE_SIZE, (CFG.MAP_W - 1) * CFG.TILE_SIZE);
            const sy = clamp(spawnArea.y + Math.sin(angle) * rad, CFG.TILE_SIZE, (CFG.MAP_H - 1) * CFG.TILE_SIZE);

            // Small stagger so they don't all spawn at once
            setTimeout(() => {
                if (!this.game.running) return;
                const unit = this.game.spawnUnit(type, 1, sx, sy);
                if (unit) this._assignTarget(unit);
            }, i * 120);
        }

        // Boss every 5 waves
        if (this.waveNumber % 5 === 0) {
            setTimeout(() => {
                if (!this.game.running) return;
                const boss = this.game.spawnUnit('boss', 1, spawnArea.x, spawnArea.y);
                if (boss) this._assignTarget(boss);
                notify('⚠ WARLORD DEPLOYED', 'alert');
            }, count * 120 + 300);
        }
    }

    _waveComposition() {
        if (this.waveNumber <= 2) return ['raider', 'raider', 'raider'];
        if (this.waveNumber <= 4) return ['raider', 'raider', 'hunter'];
        if (this.waveNumber <= 7) return ['raider', 'hunter', 'hunter'];
        return ['hunter', 'hunter', 'hunter', 'raider'];
    }

    _assignTarget(unit) {
        // Priority: attack nearest player building first
        const target = this._priorityTarget(unit);
        if (target) {
            unit.commandAttack(target, this.game);
        }
    }

    _priorityTarget(unit) {
        // Try to find player command center first, then any building, then any unit
        let best = null, bestD = Infinity;
        for (const ent of this.game.entities) {
            if (ent.dead || ent.team !== 0) continue;
            const d = dist(unit.x, unit.y, ent.x, ent.y);
            // Command center has highest priority
            const priority = ent.type === 'command_center' ? 0 : ent.isBuilding() ? 1 : 2;
            const score = d + priority * 500;
            if (score < bestD) { best = ent; bestD = score; }
        }
        return best;
    }

    _updateEnemyUnit(unit, dt) {
        // Re-assign target if current one is dead or none
        if (!unit.target || unit.target.dead || unit.state === 'idle') {
            const target = this._priorityTarget(unit);
            if (target) unit.commandAttack(target, this.game);
        }
    }
}