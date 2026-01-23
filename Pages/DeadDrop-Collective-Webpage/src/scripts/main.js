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
    let url = 'https://metaforge.app/api/arc-raiders/events-schedule';
    let fetchUrl = url;
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('API error: ' + res.status);
      const json = await res.json();
      renderArcEventsSchedule(json.data || json);
      console.log('ARC Events API response:', json);
      return;
    } catch (err) {
      fetchUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    }
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
  if (!Array.isArray(data) || data.length === 0) {
    arcEventsOutput.textContent = 'No events schedule data found.';
    return;
  }
  let html = `<div style='text-align:center;margin-bottom:0.5em;'>`;
  html += `<span style='display:inline-block;font-size:1.35em;font-weight:800;letter-spacing:0.01em;color:var(--accent);background:rgba(30,30,40,0.97);padding:0.35em 1.5em 0.25em 1.5em;border-radius:10px;box-shadow:0 2px 8px #0002;'>ARC Raiders Events Schedule</span>`;
  html += `</div>`;
  html += `<div style='display:flex;flex-wrap:wrap;gap:1em;margin-top:0.2em;'>`;
  window.arcEventCountdowns = [];
  data.slice(0, 8).forEach((event, idx) => {
    html += `<div class='arc-event-card' style='background:rgba(30,30,40,0.97);border-radius:8px;padding:1em 1.2em;min-width:240px;box-shadow:0 2px 8px #0002;border-left:4px solid var(--accent);display:flex;align-items:flex-start;gap:0.8em;'>`;
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

function startArcEventCountdowns() {
  if (!window.arcEventCountdowns) return;
  function updateCountdowns() {
    const now = new Date();
    window.arcEventCountdowns.forEach(ev => {
      let msg = '';
      if (now < ev.startDate) {
        const diff = ev.startDate - now;
        msg = `Starts in ${formatDuration(diff)}`;
      } else if (now >= ev.startDate && now < ev.endDate) {
        const diff = ev.endDate - now;
        msg = `Ends in ${formatDuration(diff)}`;
      } else {
        msg = 'Event ended';
      }
      const el = document.getElementById(`event-timer-${ev.idx}`);
      if (el) el.textContent = msg;
    });
  }
  updateCountdowns();
  if (window.arcEventCountdownInterval) clearInterval(window.arcEventCountdownInterval);
  window.arcEventCountdownInterval = setInterval(updateCountdowns, 1000);
}

// Helper for formatting ms to human readable
function formatDuration(ms) {
  if (ms <= 0) return '0s';
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hr = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const day = Math.floor(ms / (1000 * 60 * 60 * 24));
  let out = '';
  if (day) out += day + 'd ';
  if (hr) out += hr + 'h ';
  if (min) out += min + 'm ';
  if (sec && !day && !hr) out += sec + 's';
  return out.trim();
}
fetchArcEventsSchedule();