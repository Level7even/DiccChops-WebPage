const base = "https://copyparty.dankserver.net/diccchops/";

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

        // Populate text
        document.getElementById("projectName").textContent = cfg.meta.name || project;
        document.getElementById("projectDescription").textContent = cfg.meta.description || "";
        document.getElementById("projectTags").textContent = cfg.meta.tags || "";
        document.getElementById("projectAuthor").textContent = cfg.meta.author || "";
        document.getElementById("projectVisibility").textContent = cfg.visibility?.mode || "unknown";

        // Set model-viewer src
        const viewer = document.getElementById("viewer");
        if (cfg.files.primary) viewer.src = `${base}${project}/${cfg.files.primary}`;
        if (cfg.files.thumbnail) viewer.poster = `${base}${project}/${cfg.files.thumbnail}`;

        // Populate file list
        const fileList = document.getElementById("fileList");
        Object.values(cfg.files).forEach(file => {
            const div = document.createElement("div");
            div.className = "file-item";
            div.innerHTML = `<span>${file}</span>
                             <button onclick="window.open('${base}${project}/${file}', '_blank')">Open</button>`;
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

// Wait for DOM
document.addEventListener("DOMContentLoaded", main);
