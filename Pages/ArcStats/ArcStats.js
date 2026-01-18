// ArcStats.js - Fetch and display ARC Raiders items from ARDB API, with mock fallback
const API_BASE = "https://ardb.app/api";
const IMG_BASE = "https://ardb.app/static";

const MOCK_ITEMS = [
  { id: 1, name: "Anvil I", category: "Weapon", rarity: "Common", icon: "/icons/anvil_i.png" },
  { id: 2, name: "Wires", category: "Topside Material", rarity: "Uncommon", icon: "/icons/wires.png" },
  { id: 3, name: "Medkit", category: "Consumable", rarity: "Rare", icon: "/icons/medkit.png" },
  { id: 4, name: "Keycard", category: "Key", rarity: "Epic", icon: "/icons/keycard.png" }
];

async function fetchItems() {
    const loading = document.getElementById("arcraiders-loading");
    const list = document.getElementById("arcraiders-items");
    loading.style.display = "block";
    list.innerHTML = "";
    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        renderItems(data);
        loading.style.display = "none";
    } catch (e) {
        // Fallback to mock data for local/demo use
        renderItems(MOCK_ITEMS, true);
        loading.style.display = "none";
    }
}

function renderItems(data, isMock) {
    const list = document.getElementById("arcraiders-items");
    if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<div class="arcraiders-error">No items found.</div>';
        return;
    }
    list.innerHTML = data.slice(0, 24).map(item => `
        <div class="arcraiders-item">
            <img src="${IMG_BASE}${item.icon || ''}" alt="icon" style="width:32px;height:32px;vertical-align:middle;margin-right:8px;object-fit:contain;background:#222;border-radius:4px;">
            <strong>${item.name || "Unnamed Item"}</strong><br>
            <span>${item.category || ''} | ${item.rarity || ''}</span><br>
            <span style="font-size:12px;color:#888;">ID: ${item.id}${isMock ? ' (mock)' : ''}</span>
        </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", fetchItems);
