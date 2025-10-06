// world.js - World rendering for Project Rain

function drawWorld(ctx, canvas) {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#87CEEB'); // Light blue
    skyGradient.addColorStop(1, '#4682B4'); // Steel blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

    // Ground
    ctx.fillStyle = '#228B22'; // Forest green
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
}
