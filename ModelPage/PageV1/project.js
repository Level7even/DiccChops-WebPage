const base = "https://copyparty.dankserver.net/diccchops/";

// Map dropdown values to HDR paths
const HDR_MAP = {
    "neutral": "../Projects/HDRs/kloofendal_misty_morning_puresky_4k.hdr",
    "sunset": "../Projects/HDRs/qwantani_sunset_puresky_4k.hdr",
    "studio": "../Projects/HDRs/table_mountain_2_puresky_4k.hdr"
};

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

        if (!primaryModel) {
            console.warn(`No primary model found for project ${project}`);
        }

        // Populate text
        document.getElementById("projectName").textContent = cfg.meta.name || project;
        document.getElementById("projectDescription").textContent = cfg.meta.description || "";
        document.getElementById("projectTags").textContent = cfg.meta.tags || "";
        document.getElementById("projectAuthor").textContent = cfg.meta.author || "";
        document.getElementById("projectVisibility").textContent = cfg.visibility?.mode || "unknown";

        const viewer = document.getElementById("viewer");

        // Set model and poster
        if (primaryModel) viewer.src = `${base}${project}/${primaryModel}`;
        if (cfg.files.thumbnail) viewer.poster = `${base}${project}/${cfg.files.thumbnail}`;

        // Set default HDR environment (Neutral)
        viewer.environmentImage = HDR_MAP["neutral"];

        // Environment dropdown
        const envSelect = document.getElementById("envSelect");
        envSelect.addEventListener("change", () => {
            const val = envSelect.value.toLowerCase();
            viewer.environmentImage = HDR_MAP[val] || HDR_MAP["neutral"];
        });

        // Populate file list
        const fileList = document.getElementById("fileList");
        Object.entries(cfg.files).forEach(([key, file]) => {
            if (key.toLowerCase() === "thumbnail") return;

            const div = document.createElement("div");
            div.className = "file-item";
            div.innerHTML = `
                <span>${file}</span>
                <button onclick="window.open('${base}${project}/${file}', '_blank')">Open</button>
            `;
            fileList.appendChild(div);
        });

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

// Wait for DOM
document.addEventListener("DOMContentLoaded", main);
