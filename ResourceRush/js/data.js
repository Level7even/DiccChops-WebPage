// data.js - Resource and item definitions

const resources = {
    rock: {
        name: 'Rock',
        emoji: '🪨',
        image: 'assets/resources/rock.png',
        unlocked: true,
        unlockRequirement: null
    },
    stone: {
        name: 'Stone',
        emoji: '🪨',
        image: 'assets/resources/stone.png',
        unlocked: true,
        unlockRequirement: null
    },
    metal: {
        name: 'Metal',
        emoji: '⚙️',
        image: 'assets/resources/metal.png',
        unlocked: false,
        unlockRequirement: { resource: 'rock', amount: 10 }
    },
    // Add more resources
};

const items = {
    pickaxe: {
        name: 'Pickaxe',
        image: 'assets/items/pickaxe.png',
        recipe: { rock: 5, wood: 2 }
    },
    // Add more items
};

const audioFiles = {
    click: 'audio/click.wav',
    collect: 'audio/collect.wav',
    upgrade: 'audio/upgrade.wav'
};
