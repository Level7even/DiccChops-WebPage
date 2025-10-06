// main.js - Project Rain Game Logic

const canvas = document.getElementById('world-canvas');
const ctx = canvas.getContext('2d');

let rainDrops = [];
const maxRainDrops = 500;

// Create rain drop
function createRainDrop() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 20 + 10,
        opacity: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 5 + 10
    };
}

// Update rain
function updateRain() {
    rainDrops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
            drop.y = 0;
            drop.x = Math.random() * canvas.width;
        }
    });
}

// Draw rain
function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

// Game loop
function gameLoop() {
    updateRain();
    drawRain();
    requestAnimationFrame(gameLoop);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load world HTML
    const html = '<div id="sky"><!-- Sky background --></div><div id="ground"><!-- Ground background --></div>';
    const container = document.getElementById('game-container');
    container.innerHTML = html + '<canvas id="world-canvas"></canvas>';
    const canvas = document.getElementById('world-canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d');

    // Initialize rain
    for (let i = 0; i < maxRainDrops; i++) {
        rainDrops.push(createRainDrop());
    }

    requestAnimationFrame(gameLoop);
});
