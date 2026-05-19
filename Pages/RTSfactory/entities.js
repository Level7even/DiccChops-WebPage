// ═══════════════════════════════════════
//  STARFRONT — entities.js
//  Entity base + Unit + Building
// ═══════════════════════════════════════

class Entity {
    constructor(type, team, x, y) {
        this.id = nextId();
        this.type = type;
        this.team = team;
        this.x = x;
        this.y = y;
        this.hp = 1;
        this.hpMax = 1;
        this.dead = false;
        this.selected = false;
        this.flash = 0;
    }

    get hpFrac() { return clamp(this.hp / this.hpMax, 0, 1); }

    isUnit() { return false; }
    isBuilding() { return false; }

    takeDamage(amount, attacker) {
        if (this.dead) return;
        this.hp -= amount;
        this.flash = 0.15;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }
}

class Unit extends Entity {
    constructor(type, team, x, y) {
        super(type, team, x, y);
        const def = CFG.UNITS[type];
        this.def = def;
        this.hp = def.hp;
        this.hpMax = def.hp;
        this.radius = def.radius;
        this.speed = def.speed;
        this.angle = 0;

        this.path = null;       // array of waypoints
        this.pathIdx = 0;
        this.target = null;     // attack target
        this.harvestNode = null;
        this.carrying = 0;      // worker credits being hauled
        this.dropoffTarget = null;
        this.state = 'idle';    // idle | moving | attacking | harvesting | returning
        this.attackCD = 0;
        this.harvestCD = 0;
    }

    isUnit() { return true; }

    commandMove(tx, ty, game) {
        this.target = null;
        this.harvestNode = null;
        this.dropoffTarget = null;
        this._setPath(tx, ty, game);
        this.state = 'moving';
    }

    commandAttack(target, game) {
        if (!target || target.dead) return;
        this.target = target;
        this.harvestNode = null;
        this.state = 'attacking';
        this._setPath(target.x, target.y, game);
    }

    commandHarvest(node, game) {
        if (this.type !== 'worker') return;
        this.harvestNode = node;
        this.target = null;
        this.state = 'harvesting';
        this._setPath(node.x, node.y, game);
    }

    _setPath(tx, ty, game) {
        const p = findPath(game.map, this.x, this.y, tx, ty);
        this.path = p;
        this.pathIdx = 0;
        if (!p || p.length === 0) {
            // direct fallback
            this.path = [{ x: tx, y: ty }];
            this.pathIdx = 0;
        }
    }

    update(dt, game) {
        if (this.dead) return;
        if (this.flash > 0) this.flash -= dt;
        if (this.attackCD > 0) this.attackCD -= dt;
        if (this.harvestCD > 0) this.harvestCD -= dt;

        switch (this.state) {
            case 'attacking': this._tickAttack(dt, game); break;
            case 'harvesting': this._tickHarvest(dt, game); break;
            case 'returning': this._tickReturn(dt, game); break;
            case 'moving': this._tickMove(dt, game); break;
            default: this._tickIdle(dt, game); break;
        }
    }

    _tickIdle(dt, game) {
        // Auto-acquire nearby enemy for combat units
        if (this.type === 'worker') return;
        const range = this.def.range * 1.4;
        let best = null, bestD = range;
        for (const e of game.entities) {
            if (e.dead || e.team === this.team) continue;
            const d = dist(this.x, this.y, e.x, e.y);
            if (d < bestD) { best = e; bestD = d; }
        }
        if (best) this.commandAttack(best, game);
    }

    _tickMove(dt, game) {
        if (!this._followPath(dt, game)) {
            this.state = 'idle';
        }
    }

    _tickAttack(dt, game) {
        if (!this.target || this.target.dead) {
            this.target = null;
            this.state = 'idle';
            return;
        }
        const tx = this.target.x, ty = this.target.y;
        const d = dist(this.x, this.y, tx, ty);
        const range = this.def.range;

        if (d <= range) {
            this.path = null;
            this.angle = Math.atan2(ty - this.y, tx - this.x);
            if (this.attackCD <= 0) {
                this._fireAt(this.target, game);
                this.attackCD = 1 / this.def.attackSpeed;
            }
        } else {
            // Close distance: refresh path occasionally
            if (!this.path || this.pathIdx >= (this.path?.length || 0)) {
                this._setPath(tx, ty, game);
            }
            this._followPath(dt, game);
        }
    }

    _fireAt(target, game) {
        target.takeDamage(this.def.damage, this);
        const color = this.team === 0 ? '#00e5ff' : '#ff3355';
        game.renderer.addFX({
            type: 'laser', x1: this.x, y1: this.y,
            x2: target.x, y2: target.y, color, duration: 0.15,
        });
    }

    _tickHarvest(dt, game) {
        const node = this.harvestNode;
        if (!node || node.credits <= 0) {
            // node depleted — find another
            const next = game.map.getCrystalNear(this.x, this.y, 9999);
            if (next) { this.harvestNode = next; this._setPath(next.x, next.y, game); return; }
            this.state = 'idle';
            return;
        }
        const d = dist(this.x, this.y, node.x, node.y);
        if (d > CFG.HARVEST_RANGE) {
            if (!this.path || this.pathIdx >= this.path.length) {
                this._setPath(node.x, node.y, game);
            }
            this._followPath(dt, game);
            return;
        }
        // In range
        this.path = null;
        if (this.harvestCD <= 0 && this.carrying < CFG.HARVEST_RATE) {
            const take = Math.min(CFG.HARVEST_RATE, node.credits);
            node.credits -= take;
            this.carrying = take;
            this.harvestCD = CFG.HARVEST_INTERVAL;
        }
        if (this.carrying > 0) {
            // head to dropoff
            const cc = this._nearestDropoff(game);
            if (cc) {
                this.dropoffTarget = cc;
                this.state = 'returning';
                this._setPath(cc.x, cc.y, game);
            }
        }
    }

    _tickReturn(dt, game) {
        const cc = this.dropoffTarget;
        if (!cc || cc.dead) {
            this.dropoffTarget = this._nearestDropoff(game);
            if (!this.dropoffTarget) { this.state = 'idle'; return; }
            this._setPath(this.dropoffTarget.x, this.dropoffTarget.y, game);
            return;
        }
        const d = dist(this.x, this.y, cc.x, cc.y);
        if (d <= cc.pixelW / 2 + 20) {
            game.economy.addCredits(this.carrying);
            this.carrying = 0;
            // resume harvest
            if (this.harvestNode && this.harvestNode.credits > 0) {
                this.state = 'harvesting';
                this._setPath(this.harvestNode.x, this.harvestNode.y, game);
            } else {
                const next = game.map.getCrystalNear(this.x, this.y, 9999);
                if (next) {
                    this.harvestNode = next;
                    this.state = 'harvesting';
                    this._setPath(next.x, next.y, game);
                } else this.state = 'idle';
            }
            return;
        }
        if (!this.path || this.pathIdx >= this.path.length) {
            this._setPath(cc.x, cc.y, game);
        }
        this._followPath(dt, game);
    }

    _nearestDropoff(game) {
        let best = null, bestD = Infinity;
        for (const e of game.entities) {
            if (e.dead || e.team !== this.team) continue;
            if (!e.isBuilding() || e.constructing) continue;
            if (e.type !== 'command_center') continue;
            const d = dist(this.x, this.y, e.x, e.y);
            if (d < bestD) { best = e; bestD = d; }
        }
        return best;
    }

    _followPath(dt, game) {
        if (!this.path || this.pathIdx >= this.path.length) return false;
        const wp = this.path[this.pathIdx];
        const dx = wp.x - this.x;
        const dy = wp.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const step = this.speed * dt;
        if (d <= step) {
            this.x = wp.x; this.y = wp.y;
            this.pathIdx++;
            if (this.pathIdx >= this.path.length) {
                this.path = null;
                return false;
            }
        } else {
            this.x += (dx / d) * step;
            this.y += (dy / d) * step;
            this.angle = Math.atan2(dy, dx);
        }
        return true;
    }
}

class Building extends Entity {
    constructor(type, team, tileX, tileY) {
        const def = CFG.BUILDINGS[type];
        const ts = CFG.TILE_SIZE;
        const sz = def.tileSize;
        const cx = tileX * ts + (sz * ts) / 2;
        const cy = tileY * ts + (sz * ts) / 2;
        super(type, team, cx, cy);
        this.def = def;
        this.tileX = tileX;
        this.tileY = tileY;
        this.pixelW = sz * ts;
        this.pixelH = sz * ts;
        this.hp = def.hp;
        this.hpMax = def.hp;

        this.constructing = def.buildTime > 0;
        this.buildProgress = this.constructing ? 0 : 1;
        if (!this.constructing) this.hp = def.hp;
        else this.hp = Math.max(1, Math.floor(def.hp * 0.1));

        this.pulse = Math.random() * Math.PI * 2;

        // Production
        this.trainQueue = [];
        this.queueProgress = 0; // 0..1

        // Turret combat
        this.attackTarget = null;
        this.attackCD = 0;
    }

    isBuilding() { return true; }

    queueTrain(unitType) {
        if (!this.def.trains.includes(unitType)) return false;
        this.trainQueue.push(unitType);
        return true;
    }

    update(dt, game) {
        if (this.dead) return;
        if (this.flash > 0) this.flash -= dt;
        this.pulse += dt * 2;

        if (this.constructing) {
            this.buildProgress += dt / this.def.buildTime;
            // gradually fill HP during build
            this.hp = clamp(this.def.hp * this.buildProgress, 1, this.def.hp);
            if (this.buildProgress >= 1) {
                this.buildProgress = 1;
                this.constructing = false;
                this.hp = this.def.hp;
                notify(`${this.def.name} complete.`);
            }
            return;
        }

        // Training
        if (this.trainQueue.length > 0) {
            const nextType = this.trainQueue[0];
            const udef = CFG.UNITS[nextType];
            this.queueProgress += dt / udef.trainTime;
            if (this.queueProgress >= 1) {
                this.queueProgress = 0;
                this.trainQueue.shift();
                // spawn near building
                const sx = this.x + (Math.random() - 0.5) * this.pixelW * 0.6;
                const sy = this.y + this.pixelH / 2 + 24;
                game.spawnUnit(nextType, this.team, sx, sy);
            }
        }

        // Turret behavior
        if (this.type === 'turret') this._tickTurret(dt, game);
    }

    _tickTurret(dt, game) {
        if (this.attackCD > 0) this.attackCD -= dt;
        const range = this.def.attackRange;

        if (!this.attackTarget || this.attackTarget.dead
            || dist(this.x, this.y, this.attackTarget.x, this.attackTarget.y) > range) {
            // acquire
            let best = null, bestD = range;
            for (const e of game.entities) {
                if (e.dead || e.team === this.team) continue;
                if (!e.isUnit()) continue;
                const d = dist(this.x, this.y, e.x, e.y);
                if (d < bestD) { best = e; bestD = d; }
            }
            this.attackTarget = best;
        }

        if (this.attackTarget && this.attackCD <= 0) {
            this.attackTarget.takeDamage(this.def.damage, this);
            this.attackCD = 1 / this.def.attackSpeed;
            game.renderer.addFX({
                type: 'laser', x1: this.x, y1: this.y,
                x2: this.attackTarget.x, y2: this.attackTarget.y,
                color: '#ff8800', duration: 0.12,
            });
        }
    }
}
