const SHEET_ID = '1W8i3Mv5MlArFy5bVZzLDUgMMoHndZTEM533JMBKenzU';
const SHEET_GID = '0'; // Change if your data is not in the first sheet
const SHEET_URL = 'https://corsproxy.io/?' + encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`);

function createCard({ image, name, amount, price, rarity, type }, ignoreAmount = false) {
    if (!ignoreAmount && parseInt(amount, 10) < 1) return null; // Hide card if amount is 0 or less, unless ignoreAmount is true
    const card = document.createElement('div');
    card.className = 'item-card';

    // Set border color based on rarity
    let borderColor = '#888'; // Default grey
    let isLegendary = false;
    switch ((rarity || '').toLowerCase()) {
        case 'uncommon': borderColor = '#4caf50'; break; // Green
        case 'rare': borderColor = '#2196f3'; break; // Blue
        case 'epic': borderColor = '#ab47bc'; break; // Purple/Pink
        case 'legendary':
            borderColor = 'linear-gradient(90deg, #ff9800, #ffd700)';
            isLegendary = true;
            break;
        case 'common':
        case '': borderColor = '#888'; break; // Grey
    }
    if (isLegendary) {
        card.style.border = '3px solid #ff9800';
        card.style.boxShadow = '0 0 12px 2px #ffd700, 0 0 0 4px #ff9800 inset';
    } else {
        card.style.border = `3px solid ${borderColor}`;
    }

    const img = document.createElement('img');
    img.src = image;
    img.alt = name;

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'item-img-wrapper';
    const bgImg = document.createElement('img');
    bgImg.src = 'https://arcraiders.wiki/w/images/5/55/UI_Blueprint_background.png';
    bgImg.alt = '';
    bgImg.className = 'item-bg-img';
    img.className = 'item-img';
    imgWrapper.appendChild(bgImg);
    imgWrapper.appendChild(img);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'item-name';
    nameDiv.textContent = name;

    const typeDiv = document.createElement('div');
    typeDiv.className = 'item-type';
    typeDiv.textContent = type ? `Type: ${type}` : '';

    const priceDiv = document.createElement('div');
    priceDiv.className = 'item-price';
    priceDiv.textContent = `Price: ${price}`;

    const rarityDiv = document.createElement('div');
    rarityDiv.className = 'item-rarity';
    rarityDiv.textContent = rarity ? `Rarity: ${rarity}` : '';

    card.appendChild(imgWrapper);
    card.appendChild(nameDiv);
    if (type) card.appendChild(typeDiv);
    card.appendChild(priceDiv);
    if (rarity) card.appendChild(rarityDiv);

    return card;
}

function renderCards(items) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';
    // Define rarity order
    const rarityOrder = {
        'legendary': 5,
        'epic': 4,
        'rare': 3,
        'uncommon': 2,
        'common': 1,
        '': 0
    };
    // Sort by rarity, then by type, then by name
    items.sort((a, b) => {
        const rA = rarityOrder[(a.rarity || '').toLowerCase()] || 0;
        const rB = rarityOrder[(b.rarity || '').toLowerCase()] || 0;
        if (rA !== rB) return rB - rA;
        if ((a.type || '') < (b.type || '')) return -1;
        if ((a.type || '') > (b.type || '')) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });
    items.forEach(item => {
        const card = createCard(item);
        if (card) container.appendChild(card);
    });
}

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines[0].toLowerCase().includes('image') && lines[0].toLowerCase().includes('name')) {
        lines.shift();
    }
    return lines.map(line => {
        const parts = [];
        let match;
        const regex = /(?:"([^"]*)")|([^,]+)/g;
        let lastIndex = 0;
        while ((match = regex.exec(line)) !== null) {
            if (match[1] !== undefined) {
                parts.push(match[1]);
            } else if (match[2] !== undefined) {
                parts.push(match[2]);
            }
            lastIndex = regex.lastIndex;
        }
        while (parts.length < 8) parts.push(''); // Ensure at least 8 columns
        return {
            image: parts[0].trim(),
            name: parts[1].trim(),
            amount: parts[2].trim(),
            price: parts[3].trim(),
            rarity: parts[4].trim(),
            type: parts[5].trim(),
            hot: parts[6].trim(), // G column
            game: parts[7].trim().toLowerCase() // H column
        };
    })
    .filter(item => (item.image || item.name || item.amount || item.price) && !(item.name.toLowerCase().includes('total')));
}

// --- Hot Section at Top ---
function renderHotSection() {
    // Show hot items from ALL games, regardless of amount
    let hotItems = allItems.filter(item => {
        const val = (item.hot || '').toString().trim().toLowerCase();
        return val === '1' || val === 'true' || val === 'yes' || val === 'on' || val === 'y';
    });
    let hotSection = document.getElementById('hot-section');
    if (!hotSection) {
        hotSection = document.createElement('section');
        hotSection.id = 'hot-section';
        hotSection.className = 'panel';
        hotSection.innerHTML = `
            <h2 style="display:flex;align-items:center;gap:0.5em;font-size:2rem;">
                <span style="font-size:2.2rem;">🔥</span> Hot Session Highlights
                <span style="font-size:1.1rem;color:var(--muted);font-weight:400;margin-left:0.5em;">(Recent extractions &amp; notable finds)</span>
            </h2>
            <div class="carousel-outer"><div class="card-container carousel-inner" id="hot-card-container"></div></div>
        `;
        const main = document.querySelector('main');
        main.insertBefore(hotSection, main.firstChild);
    }
    const hotContainer = document.getElementById('hot-card-container');
    hotContainer.innerHTML = '';

    // Infinite carousel: clone last N to start and first N to end
    const visibleCount = 4;
    const total = hotItems.length;
    if (total === 0) {
        hotSection.style.display = 'none';
        return;
    } else {
        hotSection.style.display = '';
    }
    // Clone last N
    for (let i = total - visibleCount; i < total; i++) {
        const idx = ((i % total) + total) % total;
        const card = createCard(hotItems[idx], true);
        if (card) {
            const gameLabel = document.createElement('div');
            gameLabel.className = 'hot-game-label';
            gameLabel.textContent = hotItems[idx].game ? `Game: ${hotItems[idx].game}` : '';
            card.appendChild(gameLabel);
            hotContainer.appendChild(card);
        }
    }
    // Real cards
    hotItems.forEach(item => {
        const card = createCard(item, true);
        if (card) {
            const gameLabel = document.createElement('div');
            gameLabel.className = 'hot-game-label';
            gameLabel.textContent = item.game ? `Game: ${item.game}` : '';
            card.appendChild(gameLabel);
            hotContainer.appendChild(card);
        }
    });
    // Clone first N
    for (let i = 0; i < visibleCount; i++) {
        const idx = i % total;
        const card = createCard(hotItems[idx], true);
        if (card) {
            const gameLabel = document.createElement('div');
            gameLabel.className = 'hot-game-label';
            gameLabel.textContent = hotItems[idx].game ? `Game: ${hotItems[idx].game}` : '';
            card.appendChild(gameLabel);
            hotContainer.appendChild(card);
        }
    }
    // Carousel logic
    let currentIndex = visibleCount;
    const cards = hotContainer.children;
    let isJumping = false;
    let scrollOffset = currentIndex * (cards[0]?.offsetWidth || 0);
    let cardWidth = cards[0]?.offsetWidth || 0;
    let animationFrameId;
    const speed = 0.7; // px per frame, adjust for faster/slower scroll

    function updateCarousel(animate = true) {
        if (!animate) {
            hotContainer.style.transition = 'none';
        } else {
            hotContainer.style.transition = 'transform 0.7s cubic-bezier(0.4,0,0.2,1)';
        }
        hotContainer.style.transform = `translateX(-${scrollOffset}px)`;
        if (!animate) {
            void hotContainer.offsetWidth;
            hotContainer.style.transition = 'transform 0.7s cubic-bezier(0.4,0,0.2,1)';
        }
    }

    function smoothScroll() {
        scrollOffset += speed;
        // When we've scrolled past the last real card set, jump back
        const maxOffset = (cards.length - visibleCount) * cardWidth;
        if (scrollOffset >= maxOffset) {
            scrollOffset = visibleCount * cardWidth;
            updateCarousel(false);
            // Wait for the next animation frame before resuming scroll
            requestAnimationFrame(() => {
                animationFrameId = requestAnimationFrame(smoothScroll);
            });
            return;
        }
        updateCarousel();
        animationFrameId = requestAnimationFrame(smoothScroll);
    }

    // Start smooth scroll
    if (window.hotCarouselInterval) cancelAnimationFrame(window.hotCarouselInterval);
    if (cards.length > visibleCount * 2) {
        animationFrameId = requestAnimationFrame(smoothScroll);
        window.hotCarouselInterval = animationFrameId;
    }
}

// --- Tab Filtering Logic ---
let allItems = [];
let currentTab = 'arc';

function renderFilteredCards() {
    let filtered = allItems.filter(item => item.game === currentTab);
    renderCards(filtered);
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            renderFilteredCards();
        });
    });
}

fetch(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + '_=' + new Date().getTime())
    .then(res => {
        if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
        return res.text();
    })
    .then(text => {
        allItems = parseCSV(text);
        setupTabs();
        renderFilteredCards();
        renderHotSection();
    })
    .catch(err => {
        document.getElementById('card-container').textContent = 'Failed to load items: ' + err;
        console.error(err);
    });

// --- ARC Raiders Map Data Integration ---
const arcApiOutput = document.getElementById('arc-api-output');
const arcMapOutput = document.createElement('div');
arcMapOutput.id = 'arc-map-output';
arcMapOutput.style = 'margin-top:2em;min-height:2em;color:var(--muted);';
if (arcApiOutput && arcApiOutput.parentElement) {
  arcApiOutput.parentElement.appendChild(arcMapOutput);
}
//fetchArcMapData();
async function fetchArcMapData() {
  arcMapOutput.textContent = 'Loading ARC Raiders map data...';
  try {
    let url = 'https://metaforge.app/api/game-map-data';
    let fetchUrl = url;
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('API error: ' + res.status);
      const json = await res.json();
      renderArcMapData(json.data || json);
      console.log('ARC Map API response:', json);
      return;
    } catch (err) {
      fetchUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    }
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('API error: ' + res.status);
    const json = await res.json();
    renderArcMapData(json.data || json);
    console.log('ARC Map API response (via proxy):', json);
  } catch (err) {
    arcMapOutput.innerHTML = `<span style='color:#e63946;'>Failed to load ARC Raiders map data.</span><br><span style='font-size:0.97em;'>${err.message || err}</span><br><span style='font-size:0.95em;color:#888;'>Check browser console for details.</span>`;
    console.error('ARC Map API error:', err);
  }
}
function renderArcMapData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    arcMapOutput.textContent = 'No map data found.';
    return;
  }
  let html = `<strong>ARC Raiders Map Data</strong><div style='display:flex;flex-wrap:wrap;gap:1em;margin-top:0.7em;'>`;
  data.slice(0, 8).forEach(map => {
    html += `<div class='arc-map-card' style='background:rgba(30,30,40,0.97);border-radius:8px;padding:1em 1.2em;min-width:220px;box-shadow:0 2px 8px #0002;border-left:4px solid var(--accent);'>`;
    html += `<div style='font-size:1.1em;font-weight:600;margin-bottom:0.3em;'>${map.name || map.mapID || 'Unknown Map'}</div>`;
    if (map.description) html += `<div style='font-size:0.98em;color:var(--muted);margin-bottom:0.3em;'>${map.description}</div>`;
    if (map.zoneType) html += `<div style='font-size:0.97em;color:#ffd600;'>Zone: ${map.zoneType}</div>`;
    html += `</div>`;
  });
  html += '</div>';
  arcMapOutput.innerHTML = html;
}

// --- ARC Raiders Events Schedule Integration ---
const arcEventsOutput = document.createElement('div');
arcEventsOutput.id = 'arc-events-output';
arcEventsOutput.style = 'margin-top:2em;min-height:2em;color:var(--muted);';
if (arcMapOutput && arcMapOutput.parentElement) {
  arcMapOutput.parentElement.appendChild(arcEventsOutput);
}
async function fetchArcEventsSchedule() {
  arcEventsOutput.textContent = 'Loading ARC Raiders events schedule...';
  try {
    // Always use the CORS proxy for this endpoint
    let url = 'https://metaforge.app/api/arc-raiders/events-schedule';
    let fetchUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('API error: ' + res.status);
    const json = await res.json();
    renderArcEventsSchedule(json.data || json);
    console.log('ARC Events API response (via proxy):', json);
  } catch (err) {
    arcEventsOutput.innerHTML = `<span style='color:#e63946;'>Failed to load ARC Raiders events schedule.</span><br><span style='font-size:0.97em;'>${err.message || err}</span><br><span style='font-size:0.95em;color:#888;'>Check browser console for details.</span>`;
    console.error('ARC Events API error:', err);
  }
}
function renderArcEventsSchedule(data) {
  console.log('renderArcEventsSchedule called', data);
  const arcEventsOutput = window.arcEventsOutput;
  if (!arcEventsOutput) return;
  if (!Array.isArray(data) || data.length === 0) {
    arcEventsOutput.textContent = 'No events schedule data found.';
    return;
  }
  let html = `<div style='text-align:center;margin-bottom:0.5em;'>`;
  html += `<span style='display:inline-block;font-size:1.35em;font-weight:800;letter-spacing:0.01em;color:var(--accent);background:rgba(30,30,40,0.97);padding:0.35em 1.5em 0.25em 1.5em;border-radius:10px;box-shadow:0 2px 8px #0002;'>ARC Raiders Events Schedule</span>`;
  html += `</div>`;
  html += `<div class='arc-events-grid'>`;
  window.arcEventCountdowns = [];
  const now = new Date();
  data.slice(0, 8).forEach((event, idx) => {
    let borderColor = 'var(--accent)';
    if (event.startTime && event.endTime) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      if (now < startDate) {
        borderColor = '#2196f3'; // blue for upcoming
      } else if (now >= startDate && now <= endDate) {
        borderColor = '#4caf50'; // green for running
      } else if (now > endDate) {
        borderColor = '#e63946'; // red for ended
      }
    }
    html += `<div class='arc-event-card' style='background:rgba(30,30,40,0.97);border-radius:8px;padding:1em 1.2em;min-width:0;max-width:100%;width:100%;box-shadow:0 2px 8px #0002;border-left:4px solid ${borderColor};display:flex;align-items:flex-start;gap:0.8em;'>`;
    if (event.icon) html += `<img src='${event.icon}' alt='' style='height:2.2em;width:2.2em;vertical-align:middle;margin-right:0.5em;border-radius:4px;box-shadow:0 1px 4px #0003;'>`;
    html += `<div>`;
    html += `<div style='font-size:1.1em;font-weight:600;margin-bottom:0.2em;'>${event.name || 'Unknown Event'}</div>`;
    html += `<div style='font-size:0.98em;color:var(--accent);font-weight:500;margin-bottom:0.2em;'>${event.map || 'Unknown Map'}</div>`;
    if (event.startTime && event.endTime) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      const start = startDate.toLocaleString();
      const end = endDate.toLocaleString();
      html += `<div style='font-size:0.97em;color:#aaa;'>${start} &ndash; ${end}</div>`;
      html += `<div style='font-size:0.97em;color:var(--accent);margin-top:0.1em;'><span id='event-timer-${idx}'></span></div>`;
      window.arcEventCountdowns.push({
        idx,
        startDate,
        endDate
      });
    }
    html += `</div></div>`;
  });
  html += '</div>';
  arcEventsOutput.innerHTML = html;
  startArcEventCountdowns();
}

// --- Countdown Timers for Events ---
function startArcEventCountdowns() {
  const now = new Date();
  window.arcEventCountdowns.forEach(({ idx, startDate, endDate }) => {
    const timerEl = document.getElementById(`event-timer-${idx}`);
    if (!timerEl) return;
    const updateTimer = () => {
      const now = new Date();
      const diff = endDate - now;
      if (diff < 0) {
        timerEl.textContent = 'Event Ended';
        clearInterval(timerEl.timerInterval);
        return;
      }
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      timerEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };
    updateTimer();
    timerEl.timerInterval = setInterval(updateTimer, 1000);
  });
}

// --- Debugging and Utility Functions ---
function downloadObjectAsCSV(exportObj, fileName) {
    const csv = Object.keys(exportObj[0]).join(',') + '\n' + exportObj.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName + '.csv');
    a.click();
    URL.revokeObjectURL(url);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function hexToRgbA(hex, alpha = 1) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    });
    return '#' + result.join('');
}

function lightenDarkenColor(color, amount) {
    const rgb = color.match(/\d+/g);
    const r = Math.min(255, Math.max(0, parseInt(rgb[0]) + amount));
    const g = Math.min(255, Math.max(0, parseInt(rgb[1]) + amount));
    const b = Math.min(255, Math.max(0, parseInt(rgb[2]) + amount));
    return `rgb(${r},${g},${b})`;
}

function isColorDark(color) {
    const rgb = color.match(/\d+/g);
    const brightness = Math.sqrt(
        0.299 * (rgb[0] * rgb[0]) +
        0.587 * (rgb[1] * rgb[1]) +
        0.114 * (rgb[2] * rgb[2])
    );
    return brightness < 128;
}

function getContrastYIQ(hexcolor){
    var r = parseInt(hexcolor[1]+hexcolor[2],16);
    var g = parseInt(hexcolor[3]+hexcolor[4],16);
    var b = parseInt(hexcolor[5]+hexcolor[6],16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128 ? 'black' : 'white');
}

function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor() {
    return `rgb(${randomIntFromRange(0, 255)}, ${randomIntFromRange(0, 255)}, ${randomIntFromRange(0, 255)})`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function uniqueArrayByKey(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) {
            return false;
        }
        seen.add(val);
        return true;
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        }
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
            if ((Date.now() - lastRan) >= limit) {
                func.apply(context, args);
                lastRan = Date.now();
            }
        }, limit - (Date.now() - lastRan));
    };
}

function sortObjectKeys(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    sortedKeys.forEach(key => {
        sortedObj[key] = obj[key];
    });
    return sortedObj;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target)
            Object.assign(source[key], mergeDeep(target[key], source[key]));
    }
    Object.assign(target, source);
    return target;
}

function escapeHtml(html) {
    const text = document.createTextNode(html);
    const div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
}

function unescapeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText || div.textContent;
}

function csvToArray(csv, delimiter = ',') {
    const lines = csv.split('\n');
    return lines.map(line => line.split(delimiter).map(item => item.trim()));
}

function arrayToCsv(data, delimiter = ',') {
    return data.map(row => row.join(delimiter)).join('\n');
}

function downloadCsv(data, filename = 'data.csv', delimiter = ',') {
    const csv = arrayToCsv(data, delimiter);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
    URL.revokeObjectURL(url);
}

function uploadCsv(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = csvToArray(text);
            callback(data);
        };
        reader.readAsText(file);
    });
    input.click();
    document.body.removeChild(input);
}

// --- ARC Raiders Specific Functions ---
function extractArcRaidersData(rawData) {
    const extracted = rawData.map(item => {
        return {
            name: item.name,
            image: item.image,
            rarity: item.rarity,
            type: item.type,
            amount: item.amount,
            price: item.price,
            hot: item.hot,
            game: item.game
        };
    });
    return extracted;
}

function filterArcRaidersByRarity(data, rarity) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === rarity.toLowerCase());
}

function groupArcRaidersByType(data) {
    return data.reduce((acc, item) => {
        const type = item.type || 'Unknown Type';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(item);
        return acc;
    }, {});
}

function sortArcRaidersByName(data) {
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

function getArcRaidersPriceRange(data) {
    const prices = data.map(item => parseFloat(item.price)).filter(price => !isNaN(price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
}

function getArcRaidersAmountSummary(data) {
    const total = data.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
    const uniqueItems = new Set(data.map(item => item.name)).size;
    return { total, uniqueItems };
}

function getArcRaidersHotItems(data) {
    return data.filter(item => {
        const val = (item.hot || '').toString().trim().toLowerCase();
        return val === '1' || val === 'true' || val === 'yes' || val === 'on' || val === 'y';
    });
}

function getArcRaidersLegendaryItems(data) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === 'legendary');
}

function getArcRaidersEpicItems(data) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === 'epic');
}

function getArcRaidersRareItems(data) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === 'rare');
}

function getArcRaidersUncommonItems(data) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === 'uncommon');
}

function getArcRaidersCommonItems(data) {
    return data.filter(item => item.rarity && item.rarity.toLowerCase() === 'common');
}

function getArcRaidersItemsByType(data, type) {
    return data.filter(item => item.type && item.type.toLowerCase() === type.toLowerCase());
}

function getArcRaidersItemByName(data, name) {
    return data.find(item => item.name && item.name.toLowerCase() === name.toLowerCase());
}

function getArcRaidersItemsByGame(data, game) {
    return data.filter(item => item.game && item.game.toLowerCase() === game.toLowerCase());
}

function getArcRaidersItemImage(item) {
    return item.image || 'https://via.placeholder.com/150';
}

function getArcRaidersItemPrice(item) {
    return parseFloat(item.price) || 0;
}

function getArcRaidersItemAmount(item) {
    return parseInt(item.amount) || 0;
}

function isArcRaidersItemHot(item) {
    const val = (item.hot || '').toString().trim().toLowerCase();
    return val === '1' || val === 'true' || val === 'yes' || val === 'on' || val === 'y';
}

function isArcRaidersItemLegendary(item) {
    return item.rarity && item.rarity.toLowerCase() === 'legendary';
}

function isArcRaidersItemEpic(item) {
    return item.rarity && item.rarity.toLowerCase() === 'epic';
}

function isArcRaidersItemRare(item) {
    return item.rarity && item.rarity.toLowerCase() === 'rare';
}

function isArcRaidersItemUncommon(item) {
    return item.rarity && item.rarity.toLowerCase() === 'uncommon';
}

function isArcRaidersItemCommon(item) {
    return item.rarity && item.rarity.toLowerCase() === 'common';
}

function arcRaidersItemRarityColor(rarity) {
    switch ((rarity || '').toLowerCase()) {
        case 'uncommon': return '#4caf50'; // Green
        case 'rare': return '#2196f3'; // Blue
        case 'epic': return '#ab47bc'; // Purple/Pink
        case 'legendary': return '#ff9800'; // Orange
        case 'common':
        case '': return '#888'; // Grey
        default: return '#888'; // Default to grey
    }
}

function arcRaidersItemBorderStyle(rarity) {
    if (!rarity) return '3px solid #888'; // Default grey
    switch (rarity.toLowerCase()) {
        case 'legendary': return '3px solid #ff9800'; // Orange
        default: return `3px solid ${arcRaidersItemRarityColor(rarity)}`;
    }
}

function arcRaidersItemBoxShadow(rarity) {
    if (!rarity) return 'none';
    switch (rarity.toLowerCase()) {
        case 'legendary': return '0 0 12px 2px #ffd700, 0 0 0 4px #ff9800 inset'; // Orange glow
        default: return 'none';
    }
}

// --- End of ARC Raiders Specific Functions ---

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('card-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:var(--muted);">Loading items...</p>';
});

// --- Service Worker Registration for PWA ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

window.initArcApiSection = function initArcApiSection() {
  console.log('initArcApiSection called');
  const apiSection = document.getElementById('api-integration');
  if (!apiSection) return;
  // Use only the existing containers provided by the HTML
  const arcApiOutput = document.getElementById('arc-api-output');
  const arcMapOutput = document.getElementById('arc-map-output');
  const arcEventsOutput = document.getElementById('arc-events-output');
  if (!arcApiOutput || !arcMapOutput || !arcEventsOutput) return;
  window.arcApiOutput = arcApiOutput;
  window.arcMapOutput = arcMapOutput;
  window.arcEventsOutput = arcEventsOutput;
  fetchArcMapData();
  fetchArcEventsSchedule();
};