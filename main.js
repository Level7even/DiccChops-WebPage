document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
});

// -----------------------------
// Load Projects dynamically
// -----------------------------
async function loadProjects() {
    const container = document.getElementById("projectGrid");
    if (!container) return console.error("projectGrid not found!");

    let projectList;
    try {
        projectList = await fetch("Projects/projects.json").then(r => r.json());
    } catch (e) {
        container.innerHTML = "<p style='text-align:center;'>Could not load project list.</p>";
        console.error("Failed to load projects.json. Check folder name and json format.", e);
        return;
    }

    for (const entry of projectList) {
        const folder = entry.folder;
        const base = `Projects/${folder}/`; 

        // Load settings.cfg
        let cfg;
        try {
            cfg = await loadCFG(base + "settings.cfg");
        } catch (e) {
            console.warn(`Could not load ${base}settings.cfg`, e);
            continue;
        }

        const name = cfg.meta?.name || folder;

        const glbFile = cfg.files?.Glb || cfg.files?.glb; 
        const thumbFile = cfg.files?.thumbnail || cfg.files?.Thumbnail;

        const glb = glbFile ? `${base}Files/${glbFile}` : "Placeholder.glb";
        const thumbnail = thumbFile ? `${base}Files/${thumbFile}` : "Placeholder.png";

        console.log(`Loading Project: ${name}`, { glbPath: glb, thumbPath: thumbnail });

        // Create project card
        const card = document.createElement("a");
        card.href = `${base}index.html`;
        card.className = "card";

        // Model wrapper with tooltip
        const wrapper = document.createElement("div");
        wrapper.className = "model-wrapper";

        const tooltip = document.createElement("div");
        tooltip.className = "model-tooltip";
        tooltip.textContent = "Controls: Orbit = Drag, Zoom = Scroll, Pan = Shift + Drag";
        wrapper.appendChild(tooltip);

        const mv = document.createElement("model-viewer");
        mv.setAttribute("alt", name);
        mv.setAttribute("src", glb);
        mv.setAttribute("poster", thumbnail);
        mv.setAttribute("shadow-intensity", "1");
        mv.setAttribute("camera-controls", "");
        mv.setAttribute("auto-rotate", "");
        mv.setAttribute("touch-action", "pan-y");
        mv.style.width = "100%";
        mv.style.height = "200px";
        mv.style.borderRadius = "8px";
        mv.style.backgroundColor = "#222";

        wrapper.appendChild(mv);
        card.appendChild(wrapper);

        const title = document.createElement("h3");
        title.textContent = name;
        card.appendChild(title);

        container.appendChild(card);
    }
}

// -----------------------------
// Load settings.cfg (INI-style)
// -----------------------------
async function loadCFG(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const cfg = {};
    let section = null;

    for (let raw of lines) {
        let line = raw.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) continue;

        if (line.startsWith("[") && line.endsWith("]")) {
            section = line.slice(1, -1);
            cfg[section] = {};
            continue;
        }

        if (section && line.includes("=")) {
            let [key, val] = line.split("=");
            cfg[section][key.trim()] = val.trim().replace(/^"|"$/g, "");
        }
    }
    return cfg;
}
