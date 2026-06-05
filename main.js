(function () {
    const USER = "DiccChops";
    const API = `https://api.sketchfab.com/v3/models?user=${USER}&sort_by=-publishedAt&count=24`;

    const CACHE_KEY = "sf_models_v5_all";
    const CACHE_TIME = 1000 * 60 * 60 * 6;
    const MAX_PAGES = 50;

    const grid = document.getElementById("projectGrid");
    const stats = document.getElementById("modelStats");
    const progress = document.querySelector(".scroll-progress");

    let models = [];
    let sortKey = "date";
    let sortDir = "desc";
    let activeModal = null;

    /* ---------------- CACHE ---------------- */
    function loadCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.time > CACHE_TIME) return null;
            return data.models;
        } catch {
            return null;
        }
    }

    function saveCache(data) {
        try {
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ time: Date.now(), models: data })
            );
        } catch { }
    }

    /* ---------------- FETCH ---------------- */
    async function fetchPage(url, retry = 2) {
        for (let i = 0; i <= retry; i++) {
            try {
                const res = await fetch(url, { cache: "no-store", mode: "cors" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!json.results) throw new Error("Bad data");
                return json;
            } catch (err) {
                console.warn(`Fetch attempt ${i + 1} failed`, err);
                if (i === retry) throw err;
                await new Promise(r => setTimeout(r, 800 * (i + 1)));
            }
        }
    }

    async function fetchModels() {
        const cached = loadCache();
        if (cached?.length) return cached;

        const all = [];
        let url = API;
        let pages = 0;

        while (url && pages < MAX_PAGES) {
            const json = await fetchPage(url);
            all.push(...json.results);
            stats.textContent = `Loading ${all.length}…`;
            url = json.next || null;
            pages++;
        }

        if (!all.length) throw new Error("No models");
        saveCache(all);
        return all;
    }

    /* ---------------- SORT ---------------- */
    function getMetric(m, key) {
        if (key === "likes") return m.likeCount ?? 0;
        if (key === "views") return m.viewCount ?? 0;
        if (key === "downloads") {
            return m.downloadCount
                ?? m.archives?.gltf?.size
                ?? m.archives?.source?.size
                ?? 0;
        }
        return 0;
    }

    function sortData(list) {
        const arr = [...list];
        const sign = sortDir === "desc" ? 1 : -1;

        if (sortKey === "date") {
            return arr.sort((a, b) =>
                sign * (new Date(b.publishedAt) - new Date(a.publishedAt))
            );
        }

        return arr.sort((a, b) => {
            const diff = getMetric(b, sortKey) - getMetric(a, sortKey);
            if (diff !== 0) return sign * diff;
            return sign * (new Date(b.publishedAt) - new Date(a.publishedAt));
        });
    }

    /* ---------------- HELPERS ---------------- */
    function escapeHTML(str) {
        return String(str ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* ---------------- CARD ---------------- */
    function card(m) {
        const el = document.createElement("article");
        el.className = "sketchfab-card";

        const thumb = m.thumbnails?.images?.[0]?.url
            || `https://media.sketchfab.com/models/${m.uid}/thumbnails/default.jpg`;

        const name = escapeHTML(m.name);
        const desc = escapeHTML((m.description || "").slice(0, 100));

        el.innerHTML = `
            <div class="model-preview" role="button" tabindex="0" aria-label="Open ${name} in fullscreen viewer">
                <img class="model-thumb" src="${escapeHTML(thumb)}" alt="${name} preview" loading="lazy">
                <div class="play-overlay" aria-hidden="true">▶</div>
            </div>
            <div class="card-content">
                <h3 class="model-title">${name}</h3>
                <p class="model-description">${desc}</p>
                <div class="card-stats">
                    <span title="Likes">❤️ ${m.likeCount || 0}</span>
                    <span title="Views">👁️ ${m.viewCount || 0}</span>
                    <span title="Downloads">⬇️ ${m.downloadCount || 0}</span>
                </div>
                <div class="card-actions">
                    <a class="btn-view btn-viewer" href="./Pages/Modelviewer/index.html#uid=${encodeURIComponent(m.uid)}&name=${encodeURIComponent(m.name || '')}">Open in Viewer</a>
                    <a class="btn-view btn-sketchfab" href="${escapeHTML(m.viewerUrl)}" target="_blank" rel="noopener">Sketchfab ↗</a>
                </div>
            </div>
        `;

        const preview = el.querySelector(".model-preview");
        const open = () => openModal(m.uid, m.name);
        preview.addEventListener("click", open);
        preview.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
            }
        });

        return el;
    }

    /* ---------------- MODAL ---------------- */
    function openModal(uid, label) {
        closeModal();

        const modal = document.createElement("div");
        modal.className = "sf-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", `${label} 3D viewer`);

        modal.innerHTML = `
            <div class="sf-modal-inner">
                <iframe
                    src="https://sketchfab.com/models/${encodeURIComponent(uid)}/embed?autostart=1&ui_infos=0&ui_watermark=0"
                    title="${escapeHTML(label)} 3D model"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    allowfullscreen></iframe>
                <button class="sf-modal-close" aria-label="Close viewer">Close ✕</button>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        activeModal = modal;

        modal.querySelector(".sf-modal-close").addEventListener("click", closeModal);
        modal.addEventListener("click", e => {
            if (e.target === modal) closeModal();
        });

        modal.querySelector(".sf-modal-close").focus();
    }

    function closeModal() {
        if (!activeModal) return;
        activeModal.remove();
        activeModal = null;
        document.body.style.overflow = "";
    }

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && activeModal) closeModal();
    });

    /* ---------------- RENDER ---------------- */
    function skeleton(n = 6) {
        let html = "";
        for (let i = 0; i < n; i++) {
            html += `
                <div class="skeleton-card" aria-hidden="true">
                    <div class="skeleton-img"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>`;
        }
        grid.innerHTML = html;
    }

    function render(list) {
        grid.innerHTML = "";
        const frag = document.createDocumentFragment();
        list.forEach(m => frag.appendChild(card(m)));
        grid.appendChild(frag);
        stats.textContent = `${list.length} projects`;
    }

    /* ---------------- FILTERS ---------------- */
    function bindFilters() {
        const buttons = document.querySelectorAll(".filter-btn");

        const paint = () => {
            buttons.forEach(b => {
                const k = b.dataset.sort;
                const isActive = k === sortKey;
                b.classList.toggle("active", isActive);
                b.classList.toggle("dir-desc", isActive && sortDir === "desc");
                b.classList.toggle("dir-asc", isActive && sortDir === "asc");

                let ind = b.querySelector(".sort-indicator");
                if (isActive) {
                    if (!ind) {
                        ind = document.createElement("span");
                        ind.className = "sort-indicator";
                        b.appendChild(ind);
                    }
                    ind.textContent = sortDir === "desc" ? " ↓" : " ↑";
                    ind.setAttribute("aria-label",
                        sortDir === "desc" ? "descending" : "ascending");
                    b.setAttribute("aria-pressed", "true");
                } else {
                    ind?.remove();
                    b.setAttribute("aria-pressed", "false");
                }
            });
        };

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const t = btn.dataset.sort;

                if (t === "reset") {
                    sortKey = "date";
                    sortDir = "desc";
                } else if (t === sortKey) {
                    sortDir = sortDir === "desc" ? "asc" : "desc";
                } else {
                    sortKey = t;
                    sortDir = "desc";
                }

                paint();
                render(sortData(models));
            });
        });

        paint();
    }

    /* ---------------- SCROLL PROGRESS ---------------- */
    function bindScrollProgress() {
        if (!progress) return;
        const update = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
            progress.style.width = pct + "%";
        };
        document.addEventListener("scroll", update, { passive: true });
        update();
    }

    /* ---------------- DROPDOWN ---------------- */
    function bindDropdown() {
        const dd = document.querySelector(".dropdown");
        if (!dd) return;
        const btn = dd.querySelector(".dropbtn");
        const sync = () => btn.setAttribute("aria-expanded", dd.classList.contains("active"));
        btn.addEventListener("click", e => {
            e.stopPropagation();
            dd.classList.toggle("active");
            sync();
        });
        document.addEventListener("click", e => {
            if (!dd.contains(e.target)) {
                dd.classList.remove("active");
                sync();
            }
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && dd.classList.contains("active")) {
                dd.classList.remove("active");
                sync();
                btn.focus();
            }
        });
    }

    /* ---------------- INIT ---------------- */
    async function init() {
        skeleton();
        bindFilters();
        bindScrollProgress();
        bindDropdown();

        try {
            models = await fetchModels();
            render(sortData(models));
        } catch (e) {
            console.error(e);
            grid.innerHTML = `
                <div class="error-card">
                    <h3>Offline Mode Active</h3>
                    <p>Could not reach Sketchfab. Check connection and try again.</p>
                    <button class="retry-button" type="button">Retry</button>
                </div>
            `;
            grid.querySelector(".retry-button").addEventListener("click", () => location.reload());
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
