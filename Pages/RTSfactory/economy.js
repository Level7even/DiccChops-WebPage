// ═══════════════════════════════════════
//  STARFRONT — economy.js
//  Credits, Energy, Supply management
// ═══════════════════════════════════════

class Economy {
    constructor() {
        this.credits = CFG.START_CREDITS;
        this.energy = CFG.MAX_ENERGY_BASE ?? 100;
        this.energyMax = CFG.MAX_ENERGY_BASE ?? 100;

        this.supplyUsed = 0;
        this.supplyMax = 10;   // provided by Command Center by default

        this.units = 0; // current unit count (for supply display)
    }

    // ── Credits ─────────────────────────
    addCredits(amount) { this.credits += amount; }

    canAfford(cost) {
        if (!cost) return true;
        if (cost.credits && this.credits < cost.credits) return false;
        if (cost.energy && this.energy < cost.energy) return false;
        return true;
    }

    spend(cost) {
        if (!cost) return;
        if (cost.credits) this.credits -= cost.credits;
        if (cost.energy) this.energy -= cost.energy;
    }

    // ── Supply & Energy ─────────────────
    recalcProvided(entities) {
        let energy = 0;
        let supply = 0;
        let unitCount = 0;

        for (const e of entities) {
            if (e.dead || e.team !== 0) continue;

            if (e.isBuilding() && !e.constructing) {
                const p = e.def.provides;
                if (p) {
                    energy += p.energy || 0;
                    supply += p.supply || 0;
                }
            }

            if (e.isUnit() && e.team === 0) {
                unitCount += e.def.supplyUse ?? 0;
            }
        }

        this.energyMax = Math.max(100, energy);
        this.energy = Math.min(this.energy, this.energyMax);
        this.supplyMax = Math.max(10, supply);
        this.supplyUsed = unitCount;
        this.units = unitCount;
    }

    // ── HUD Update ──────────────────────
    updateHUD() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const credEl = document.getElementById('val-credits');
        if (credEl) credEl.innerHTML = Math.floor(this.credits);

        const enEl = document.getElementById('val-energy');
        if (enEl) enEl.innerHTML = `${Math.floor(this.energy)}<span class="res-dim">/${Math.floor(this.energyMax)}</span>`;

        const supEl = document.getElementById('val-supply');
        if (supEl) supEl.innerHTML = `${this.supplyUsed}<span class="res-dim">/${this.supplyMax}</span>`;
    }
}