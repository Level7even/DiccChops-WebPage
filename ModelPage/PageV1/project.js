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

        let primaryModel = cfg.files.primary || await autoDetectModel(project);

        // Populate project info
        document.getElementById("projectName").textContent = cfg.meta.name || project;
        document.getElementById("projectDescription").textContent = cfg.meta.description || "";
        document.getElementById("projectTags").textContent = cfg.meta.tags || "";
        document.getElementById("projectAuthor").textContent = cfg.meta.author || "";
        document.getElementById("projectVisibility").textContent = cfg.visibility?.mode || "unknown";

        // Setup model viewer
        const viewer = document.getElementById("viewer");
        if (primaryModel) viewer.src = `${base}${project}/${primaryModel}`;
        if (cfg.files.thumbnail) viewer.poster = `${base}${project}/${cfg.files.thumbnail}`;

        // Environment switching
        const envSelect = document.getElementById("envSelect");
        envSelect.addEventListener("change", () => {
            viewer.environmentImage = `${base}envs/${envSelect.value}.hdr`;
        });

        // Populate files
        const fileList = document.getElementById("fileList");
        Object.entries(cfg.files).forEach(([key, file]) => {
            if (key.toLowerCase() === "thumbnail") return;
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
    } catch {
        return null;
    }
}

document.addEventListener("DOMContentLoaded", main);
