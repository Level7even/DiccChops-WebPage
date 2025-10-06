// Game1.js - Harvest Moon Style Grid World Game
document.addEventListener('DOMContentLoaded', () => {
  const gameWorld = document.getElementById('game-world');
  const player = document.getElementById('player');
  const statusEl = document.getElementById('status');

  const worldSize = 20; // 20x20 grid
  const cellSize = 20; // 20px per cell

  let playerX = 10;
  let playerY = 10;

  let worldItems = [];

  // Initialize world
  initWorld();
  gameWorld.focus();

  // Player movement
  document.addEventListener('keydown', (e) => {
    let newX = playerX;
    let newY = playerY;

    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        newY = Math.max(0, playerY - 1);
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        newY = Math.min(worldSize - 1, playerY + 1);
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        newX = Math.max(0, playerX - 1);
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        newX = Math.min(worldSize - 1, playerX + 1);
        break;
      case 'p':
      case 'P':
        plantSeed();
        return;
    }

    // Check if new position is blocked
    if (!isBlocked(newX, newY)) {
      playerX = newX;
      playerY = newY;
      updatePlayerPosition();
    }
  });

  function initWorld() {
    // Spawn some items
    spawnItem('Oak', 5, 5);
    spawnItem('BerryBush', 15, 8);
    spawnItem('Boulder', 12, 12);
    spawnItem('Oak', 3, 15);
    spawnItem('BerryBush', 18, 3);

    updatePlayerPosition();
  }

  function spawnItem(type, x, y) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'world-item';
    itemDiv.style.left = x * cellSize + 'px';
    itemDiv.style.top = y * cellSize + 'px';

    let emoji = '❓';
    switch (type) {
      case 'Oak':
        emoji = '🌳';
        break;
      case 'BerryBush':
        emoji = '🌿';
        break;
      case 'Boulder':
        emoji = '🪨';
        break;
    }

    itemDiv.innerHTML = `<span class="item-emoji">${emoji}</span>`;
    gameWorld.appendChild(itemDiv);
    worldItems.push({ type, x, y, element: itemDiv });
  }

  function isBlocked(x, y) {
    return worldItems.some(item => item.x === x && item.y === y && (item.type === 'Oak' || item.type === 'Boulder'));
  }

  function updatePlayerPosition() {
    player.style.left = playerX * cellSize + 'px';
    player.style.top = playerY * cellSize + 'px';
    statusEl.textContent = `Position: (${playerX}, ${playerY})`;
  }

  function plantSeed() {
    // Check if spot is empty
    if (!worldItems.some(item => item.x === playerX && item.y === playerY)) {
      const plantDiv = document.createElement('div');
      plantDiv.className = 'world-item planted-plant';
      plantDiv.style.left = playerX * cellSize + 'px';
      plantDiv.style.top = playerY * cellSize + 'px';
      plantDiv.innerHTML = '<span class="item-emoji">🌱</span>';
      gameWorld.appendChild(plantDiv);

      worldItems.push({ type: 'PlantedPlant', x: playerX, y: playerY, element: plantDiv, plantedTime: Date.now() });

      statusEl.textContent = 'Seed planted! Wait for it to grow...';
      growPlant(plantDiv, playerX, playerY);
    } else {
      statusEl.textContent = 'Can\'t plant here!';
    }
  }

  function growPlant(plantDiv, x, y) {
    setTimeout(() => {
      plantDiv.innerHTML = '<span class="item-emoji">🌿</span>';
      statusEl.textContent = 'Plant is growing...';
    }, 20000); // 20 seconds to sprout

    setTimeout(() => {
      plantDiv.innerHTML = '<span class="item-emoji">🌳</span>';
      statusEl.textContent = 'Plant is fully grown! Press H to harvest.';
      
      // Add harvest functionality
      const harvestHandler = (e) => {
        if (e.key === 'h' || e.key === 'H') {
          if (playerX === x && playerY === y) {
            harvestPlant(plantDiv, x, y);
            document.removeEventListener('keydown', harvestHandler);
          }
        }
      };
      document.addEventListener('keydown', harvestHandler);
    }, 60000); // 60 seconds total
  }

  function harvestPlant(plantDiv, x, y) {
    plantDiv.remove();
    worldItems = worldItems.filter(item => !(item.x === x && item.y === y && item.type === 'PlantedPlant'));
    statusEl.textContent = 'Harvested! +1 Plant';
  }
});
