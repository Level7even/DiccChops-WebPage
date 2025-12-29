const base = "https://copyparty.dankserver.net/diccchops/";
const hdrBase = "../../Projects/HDRs/"; // local HDR folder

async function main() {
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");

    if (!project) {
        document.getElementById("projectName").textContent = "No project specified";
        return;
    }

    try {
        // Fetch settings.cfg
        const cfgText = await fetch(`${base}${project}/settings.cfg`).then(r => r.text());
        const cfg = parseCfg(cfgText);

        // Auto-detect model if primary not defined
        let primaryModel = cfg.files.primary;
        if (!primaryModel) {
            primaryModel = await autoDetectModel(project);
        }

        if (!primaryModel) console.warn(`No primary model found for project ${project}`);

        // Populate text
        document.getElementById("projectName").textContent = cfg.meta.name || project;
        document.getElementById("projectDescription").textContent = cfg.meta.description || "";
        document.getElementById("projectTags").textContent = cfg.meta.tags || "";
        document.getElementById("projectAuthor").textContent = cfg.meta.author || "";
        document.getElementById("projectVisibility").textContent = cfg.visibility?.mode || "unknown";

        // Set model-viewer src
        const viewer = document.getElementById("viewer");
        if (primaryModel) viewer.src = `${base}${project}/${primaryModel}`;

        // Always use Loading.mp4 as poster/placeholder
        viewer.poster = "./Loading.mp4";

        // Populate file list
        const fileList = document.getElementById("fileList");
        fileList.innerHTML = ""; // clear old items
        Object.entries(cfg.files).forEach(([key, file]) => {
            if (key.toLowerCase() === "thumbnail") return;

            const div = document.createElement("div");
            div.className = "file-item";
            div.innerHTML = `<span>${file}</span>
                            <button onclick="window.open('${base}${project}/${file}', '_blank')">Open</button>`;
            fileList.appendChild(div);
        });

        // HDR environment select
        const envSelect = document.getElementById("envSelect");

        // dynamically add HDRs from folder
        const hdrFiles = [
            "kloofendal_misty_morning_puresky_4k.hdr",
            "qwantani_sunset_puresky_4k.hdr",
            "table_mountain_2_puresky_4k.hdr"
        ];
        envSelect.innerHTML = ""; // clear default
        hdrFiles.forEach((hdr, index) => {
            const option = document.createElement("option");
            option.value = `${hdrBase}${hdr}`;
            option.textContent = `HDR ${index + 1}`;
            envSelect.appendChild(option);
        });

        // Listen for HDR change
        envSelect.addEventListener("change", () => {
            viewer.environmentImage = envSelect.value;
        });

        // Set initial HDR
        viewer.environmentImage = envSelect.value;

    } catch (err) {
        console.error("Failed to load project:", project, err);
        document.getElementById("projectName").textContent = "Failed to load project";
    }
}

// Simple INI parser
function parseCfg(text) {
    const result = {};
    let section = "";
    text.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) return;
        if (line.startsWith("[") && line.endsWith("]")) {
            section = line.slice(1, -1);
            result[section] = {};
        } else if (line.includes("=")) {
            const [key, val] = line.split("=").map(s => s.trim());
            result[section][key] = val.replace(/^"|"$/g, "");
        }
    });
    return result;
}

// Auto-detect .glb or .gltf in Copyparty folder
async function autoDetectModel(project) {
    try {
        const html = await fetch(`${base}${project}/`).then(r => r.text());
        const files = [];
        const fileRegex = /href="([^"]+)"/gi;
        let m;
        while ((m = fileRegex.exec(html)) !== null) {
            const f = m[1];
            if (!f.includes("/")) files.push(f);
        }
        return files.find(f => f.toLowerCase().endsWith(".glb") || f.toLowerCase().endsWith(".gltf"));
    } catch (err) {
        console.warn("Failed to auto-detect model for", project, err);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", main);

// Loading overlay logic
const overlay = document.getElementById("loadingOverlay");
const barInner = document.getElementById("loadingBarInner");
const viewer = document.getElementById("viewer");

if (overlay && barInner && viewer) {
    overlay.style.display = "flex";
    barInner.classList.add("animated");
    viewer.addEventListener("model-visibility", () => {
        overlay.style.display = "none";
    });
}
