const SHEET_ID = '1W8i3Mv5MlArFy5bVZzLDUgMMoHndZTEM533JMBKenzU';
const SHEET_GID = '0'; // Change if your data is not in the first sheet
const SHEET_URL = 'https://corsproxy.io/?' + encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`);

function createCard({ image, name, amount, price, rarity, type }) {
    if (parseInt(amount, 10) < 1) return null; // Hide card if amount is 0 or less
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

    card.appendChild(img);
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
        while (parts.length < 6) parts.push('');
        return {
            image: parts[0].trim(),
            name: parts[1].trim(),
            amount: parts[2].trim(),
            price: parts[3].trim(),
            rarity: parts[4].trim(),
            type: parts[5].trim()
        };
    }).filter(item => item.image || item.name || item.amount || item.price);
}

fetch(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + '_=' + new Date().getTime())
    .then(res => {
        if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
        return res.text();
    })
    .then(text => {
        const items = parseCSV(text);
        renderCards(items);
    })
    .catch(err => {
        document.getElementById('card-container').textContent = 'Failed to load items: ' + err;
        console.error(err);
    });