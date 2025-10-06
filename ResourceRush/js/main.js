// main.js - Resource Rush Game Logic

const canvas = document.getElementById('world-canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');

let inventory = { rock: 0, stone: 0, metal: 0, dirt: 0, wood: 0 };
let cameraX = 0;
let cameraY = 0;
const cameraSpeed = 5;
const worldWidth = 2000;
const worldHeight = 1000;
let viewWidth = gameContainer.clientWidth;
let viewHeight = gameContainer.clientHeight;

let keys = {};
let resources = [];
let rainDrops = [];
let ripples = [];
const maxResources = 100;
const maxRainDrops = 200;
const gravity = 0.5;
const bounceDamping = 0.7;

// Resource types
const resourceTypes = ['rock', 'stone', 'metal', 'dirt', 'wood'];
const resourceColors = { rock: '#808080', stone: '#A9A9A9', metal: '#C0C0C0', dirt: '#654321', wood: '#8B4513' };

// Load saved data
function loadGame() {
    const saved = localStorage.getItem('resourceRush');
    if (saved) {
        inventory = JSON.parse(saved);
    }
    updateCounters();
}

// Save data
function saveGame() {
    localStorage.setItem('resourceRush', JSON.stringify(inventory));
}

// Update resource counters
function updateCounters() {
    document.getElementById('rock-counter').textContent = `🪨 Rock: ${inventory.rock}`;
    document.getElementById('stone-counter').textContent = `🧱 Stone: ${inventory.stone}`;
    document.getElementById('metal-counter').textContent = `⚙️ Metal: ${inventory.metal}`;
    document.getElementById('dirt-counter').textContent = `🧱 Dirt: ${inventory.dirt}`;
    document.getElementById('wood-counter').textContent = `🌿 Wood: ${inventory.wood}`;
}

// Create resource
function createResource() {
    const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    return {
        x: Math.random() * worldWidth,
        y: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        type: type,
        onGround: false
    };
}

// Create rain drop
function createRainDrop() {
    return {
        x: Math.random() * worldWidth,
        y: 0,
        length: Math.random() * 20 + 10,
        opacity: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 5 + 10
    };
}

// Update camera
function updateCamera() {
    if (keys['w'] || keys['W']) cameraY = Math.max(0, cameraY - cameraSpeed);
    if (keys['s'] || keys['S']) cameraY = Math.min(worldHeight - viewHeight, cameraY + cameraSpeed);
    if (keys['a'] || keys['A']) cameraX = Math.max(0, cameraX - cameraSpeed);
    if (keys['d'] || keys['D']) cameraX = Math.min(worldWidth - viewWidth, cameraX + cameraSpeed);

    gameContainer.scrollLeft = cameraX;
    gameContainer.scrollTop = cameraY;
}

// Update resources
function updateResources() {
    resources.forEach(res => {
        if (!res.onGround) {
            res.vy += gravity;
            res.x += res.vx;
            res.y += res.vy;

            if (res.y >= worldHeight - 10) {
                res.y = worldHeight - 10;
                res.vy *= -bounceDamping;
                if (Math.abs(res.vy) < 1) {
                    res.onGround = true;
                    res.vy = 0;
                }
            }

            // Boundary
            if (res.x < 0 || res.x > worldWidth) {
                res.x = Math.max(0, Math.min(worldWidth, res.x));
                res.vx *= -0.5;
            }
        }
    });
}

// Update rain
function updateRain() {
    rainDrops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > worldHeight) {
            drop.y = 0;
            drop.x = Math.random() * worldWidth;
        }
    });
}

// Update ripples
function updateRipples() {
    ripples.forEach(ripple => {
        ripple.radius += 2;
        ripple.opacity -= 0.02;
    });
    ripples = ripples.filter(ripple => ripple.opacity > 0);
}

// Draw resources
function drawResources() {
    resources.forEach(res => {
        ctx.fillStyle = resourceColors[res.type];
        ctx.beginPath();
        ctx.arc(res.x, res.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw rain
function drawRain() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    rainDrops.forEach(drop => {
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.length * 0.2, drop.y + drop.length);
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

// Draw ripples
function drawRipples() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ripples.forEach(ripple => {
        ctx.globalAlpha = ripple.opacity;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

// Handle click
function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left + cameraX;
    const y = event.clientY - rect.top + cameraY;

    const radius = 100;
    const collected = [];

    resources = resources.filter(res => {
        const dx = res.x - x;
        const dy = res.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
            collected.push(res.type);
            return false;
        }
        return true;
    });

    collected.forEach(type => {
        inventory[type]++;
    });

    if (collected.length > 0) {
        ripples.push({ x, y, radius: 0, opacity: 1 });
        updateCounters();
        saveGame();
    }
}

// Resize
function resize() {
    viewWidth = gameContainer.clientWidth;
    viewHeight = gameContainer.clientHeight;
}

// Game loop
function gameLoop() {
    updateCamera();
    updateResources();
    updateRain();
    updateRipples();

    // Clear and redraw
    ctx.clearRect(0, 0, worldWidth, worldHeight);
    // Background is set in CSS

    drawResources();
    drawRain();
    drawRipples();

    requestAnimationFrame(gameLoop);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGame();

    // Initialize resources
    for (let i = 0; i < 20; i++) {
        resources.push(createResource());
    }

    // Initialize rain
    for (let i = 0; i < maxRainDrops; i++) {
        rainDrops.push(createRainDrop());
    }

    // Add new resources occasionally
    setInterval(() => {
        if (resources.length < maxResources) {
            resources.push(createResource());
        }
    }, 1000);

    // Event listeners
    document.addEventListener('keydown', (e) => { keys[e.key] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    canvas.addEventListener('click', handleClick);
    window.addEventListener('resize', resize);

    requestAnimationFrame(gameLoop);
});
