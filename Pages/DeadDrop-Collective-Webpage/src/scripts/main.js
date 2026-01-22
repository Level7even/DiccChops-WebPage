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