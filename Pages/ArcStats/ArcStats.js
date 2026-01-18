// ArcStats.js - Fetch and display ARC Raiders items from ARDB API
const API_BASE = "https://ardb.app/api";
const IMG_BASE = "https://ardb.app/static";

async function fetchItems() {
    const loading = document.getElementById("arcraiders-loading");
    const list = document.getElementById("arcraiders-items");
    loading.style.display = "block";
    list.innerHTML = "";
    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        loading.style.display = "none";
        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = '<div class="arcraiders-error">No items found.</div>';
            return;
        }
        list.innerHTML = data.slice(0, 24).map(item => `
            <div class="arcraiders-item">
                <img src="${IMG_BASE}${item.icon || ''}" alt="icon" style="width:32px;height:32px;vertical-align:middle;margin-right:8px;object-fit:contain;background:#222;border-radius:4px;">
                <strong>${item.name || "Unnamed Item"}</strong><br>
                <span>ID: ${item.id}</span>
            </div>
        `).join("");
    } catch (e) {
        loading.style.display = "none";
        list.innerHTML = '<div class="arcraiders-error">Failed to load items.</div>';
    }
}

document.addEventListener("DOMContentLoaded", fetchItems);
