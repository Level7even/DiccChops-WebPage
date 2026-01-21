const SHEET_ID = '1W8i3Mv5MlArFy5bVZzLDUgMMoHndZTEM533JMBKenzU';
const SHEET_GID = '0'; // Change if your data is not in the first sheet
const SHEET_URL = 'https://corsproxy.io/?' + encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`);

function createCard({ image, name, amount, price }) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const img = document.createElement('img');
    img.src = image;
    img.alt = name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'item-name';
    nameDiv.textContent = name;

    const amountDiv = document.createElement('div');
    amountDiv.className = 'item-amount';
    amountDiv.textContent = `Amount: ${amount}`;

    const priceDiv = document.createElement('div');
    priceDiv.className = 'item-price';
    priceDiv.textContent = `Price: ${price}`;

    card.appendChild(img);
    card.appendChild(nameDiv);
    card.appendChild(amountDiv);
    card.appendChild(priceDiv);

    return card;
}

function renderCards(items) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';
    items.forEach(item => {
        container.appendChild(createCard(item));
    });
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    // Always remove the first row as header
    lines.shift();
    return lines.map(line => {
        const parts = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
        return {
            image: parts[0] || '',
            name: parts[1] || '',
            amount: parts[2] || '',
            price: parts[3] || ''
        };
    }).filter(item => item.image || item.name || item.amount || item.price);
}

fetch(SHEET_URL)
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