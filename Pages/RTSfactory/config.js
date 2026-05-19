// ═══════════════════════════════════════
//  STARFRONT — config.js
//  All game constants and definitions
// ═══════════════════════════════════════

const CFG = {
    // Grid
    TILE_SIZE: 48,
    MAP_W: 48,
    MAP_H: 48,

    // Tile types
    T: { GRASS: 0, ROCK: 1, WATER: 2, CRYSTAL: 3 },

    // Rendering colors
    COLORS: {
        GRASS: '#0a1a08',
        GRASS2: '#0d1f0b',
        ROCK: '#141a22',
        WATER: '#071522',
        CRYSTAL: '#003322',
        GRID: 'rgba(0,255,180,0.03)',

        PLAYER: '#00e5ff',
        PLAYER_DARK: '#003d55',
        ENEMY: '#ff3355',
        ENEMY_DARK: '#550015',
        NEUTRAL: '#556677',
        WORKER: '#ffd700',

        HP_BG: 'rgba(0,0,0,0.7)',
        HP_PLAYER: '#00ff88',
        HP_ENEMY: '#ff3355',
        HP_LOW: '#ff6600',

        SELECT_FILL: 'rgba(0,229,255,0.12)',
        SELECT_BORDER: '#00e5ff',
        RALLY: 'rgba(0,229,255,0.6)',
        ATTACK_RANGE: 'rgba(255,51,85,0.07)',
        MOVE_TARGET: 'rgba(0,229,255,0.5)',

        RESOURCE_NODE: '#00ffcc',
        RESOURCE_GLOW: 'rgba(0,255,200,0.2)',
    },

    // Camera
    CAM_SPEED: 280,   // pixels per second
    CAM_EDGE_PX: 30,    // edge-scroll threshold
    ZOOM_MIN: 0.5,
    ZOOM_MAX: 1.5,
    ZOOM_STEP: 0.1,

    // Economy
    START_CREDITS: 450,
    HARVEST_RATE: 8,      // credits per harvest tick
    HARVEST_INTERVAL: 1.4,    // seconds between harvests
    HARVEST_RANGE: 70,     // pixels — how close worker must be
    CRYSTAL_MAX: 500,    // credits per crystal node

    // Unit definitions
    UNITS: {
        worker: {
            name: 'Worker',
            icon: '⛏',
            hp: 60,
            speed: 95,         // pixels/sec
            damage: 4,
            range: 50,
            attackSpeed: 1.5,  // attacks per second
            radius: 10,
            cost: { credits: 50 },
            trainTime: 8,
            team: 0,
        },
        marine: {
            name: 'Marine',
            icon: '⚔',
            hp: 110,
            speed: 110,
            damage: 14,
            range: 130,
            attackSpeed: 1.1,
            radius: 10,
            cost: { credits: 100 },
            trainTime: 12,
            supplyUse: 1,
            team: 0,
        },
        tank: {
            name: 'Siege Tank',
            icon: '🛡',
            hp: 280,
            speed: 70,
            damage: 40,
            range: 180,
            attackSpeed: 0.5,
            radius: 14,
            cost: { credits: 250, energy: 25 },
            trainTime: 22,
            supplyUse: 2,
            team: 0,
        },
        // Enemy units
        raider: {
            name: 'Raider',
            icon: '👾',
            hp: 70,
            speed: 115,
            damage: 9,
            range: 50,
            attackSpeed: 1.3,
            radius: 9,
            team: 1,
        },
        hunter: {
            name: 'Hunter',
            icon: '🎯',
            hp: 130,
            speed: 80,
            damage: 20,
            range: 150,
            attackSpeed: 0.7,
            radius: 11,
            team: 1,
        },
        boss: {
            name: 'Warlord',
            icon: '💀',
            hp: 600,
            speed: 60,
            damage: 35,
            range: 80,
            attackSpeed: 0.6,
            radius: 18,
            team: 1,
        },
    },

    // Building definitions
    BUILDINGS: {
        command_center: {
            name: 'Command Center',
            icon: '🏛',
            hp: 1200,
            tileSize: 3,
            cost: null,
            buildTime: 0,
            trains: ['worker'],
            provides: { energy: 0, supply: 10 },
            color: '#00e5ff',
            dark: '#001a22',
        },
        barracks: {
            name: 'Barracks',
            icon: '🪖',
            hp: 600,
            tileSize: 2,
            cost: { credits: 150 },
            buildTime: 18,
            trains: ['marine'],
            provides: { energy: 0, supply: 0 },
            color: '#0088ff',
            dark: '#001133',
        },
        factory: {
            name: 'War Factory',
            icon: '🔧',
            hp: 700,
            tileSize: 3,
            cost: { credits: 300 },
            buildTime: 25,
            trains: ['tank'],
            provides: { energy: 0, supply: 0 },
            color: '#ff8800',
            dark: '#220800',
        },
        power_gen: {
            name: 'Power Generator',
            icon: '⚡',
            hp: 400,
            tileSize: 2,
            cost: { credits: 100 },
            buildTime: 14,
            trains: [],
            provides: { energy: 75, supply: 0 },
            color: '#ffcc00',
            dark: '#221800',
        },
        turret: {
            name: 'Defense Turret',
            icon: '🔫',
            hp: 500,
            tileSize: 1,
            cost: { credits: 125 },
            buildTime: 11,
            trains: [],
            provides: { energy: 0, supply: 0 },
            attackRange: 200,
            damage: 22,
            attackSpeed: 1.2,
            color: '#ff6600',
            dark: '#220800',
        },
        wall: {
            name: 'Fortified Wall',
            icon: '🧱',
            hp: 900,
            tileSize: 1,
            cost: { credits: 25 },
            buildTime: 4,
            trains: [],
            provides: { energy: 0, supply: 0 },
            color: '#8899aa',
            dark: '#111a22',
        },
    },

    // Wave config
    WAVE_INTERVAL: 90,   // seconds between waves
    WAVE_BASE_COUNT: 4,
    WAVE_SCALE: 1.4,  // enemy multiplier per wave

    // Misc
    SUPPLY_HARD_CAP: 200,
    FRAME_CAP: 60,
};

// Freeze top-level so we don't accidentally mutate it
Object.freeze(CFG);