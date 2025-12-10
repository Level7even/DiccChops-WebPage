// Encode paths safely
function safePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
}

// Load settings.cfg
async function loadCFG(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
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

// Initialize project page
async function initProject() {
    const viewer = document.getElementById("viewer");
    if (!viewer) return;

    let cfg;
    try {
        cfg = await loadCFG("./settings.cfg");
    } catch (e) {
        console.error("Failed to load settings.cfg:", e);
        return;
    }

    document.getElementById("projectName").textContent = cfg.meta?.name || "Project";
    document.getElementById("pageTitle").textContent = cfg.meta?.name || "Project";
    document.getElementById("projectDescription").textContent = cfg.meta?.description || "";
    document.getElementById("projectTags").textContent = cfg.meta?.tags || "";
    document.getElementById("projectAuthor").textContent = cfg.meta?.author || "";
    document.getElementById("projectVisibility").textContent = cfg.visibility?.mode || "";

    const glbFile = cfg.files?.Glb || cfg.files?.glb;
    const thumbFile = cfg.files?.thumbnail || cfg.files?.Thumbnail;

    viewer.src = glbFile ? safePath(`Files/${glbFile}`) : "Placeholder.glb";
    viewer.poster = thumbFile ? safePath(`Files/${thumbFile}`) : "Placeholder.png";

    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";
    for (const [key, file] of Object.entries(cfg.files || {})) {
        if (key.toLowerCase() === "glb" || key.toLowerCase() === "thumbnail") continue;
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <span>${file}</span>
            <a href="${safePath(`Files/${file}`)}" download>
                <button>Download</button>
            </a>
        `;
        fileList.appendChild(div);
    }
}

// Environment Dropdown
function initEnvironmentDropdown() {
    const viewer = document.getElementById("viewer");
    const dropdown = document.getElementById("envSelect");
    if (!viewer || !dropdown) return;

    const environments = {
        neutral: "../HDRs/kloofendal_misty_morning_puresky_4k.hdr",
        sunset: "../HDRs/qwantani_sunset_puresky_4k.hdr",
        studio: "../HDRs/table_mountain_2_puresky_4k.hdr"
    };

    function setEnvironment(env) {
        viewer.setAttribute("environment-image", environments[env]);
        viewer.style.backgroundColor = "transparent";
    }

    setEnvironment("neutral");
    dropdown.addEventListener("change", () => setEnvironment(dropdown.value));
}

document.addEventListener("DOMContentLoaded", () => {
    initProject();
    initEnvironmentDropdown();
});
