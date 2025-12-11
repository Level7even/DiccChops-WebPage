const base = "https://copyparty.dankserver.net/diccchops/";

async function loadProjects() {
    // 1. Load Copyparty directory HTML
    const html = await fetch(base).then(r => r.text());

    // Extract folder names
    const folders = extractFolders(html);

    for (const folder of folders) {
        try {
            const cfgURL = `${base}${folder}/settings.cfg`;
            const cfgText = await fetch(cfgURL).then(r => {
                if (!r.ok) throw new Error();
                return r.text();
            });

            const cfg = parseCfg(cfgText);

            // Skip hidden projects
            const visibilityMode = cfg.visibility?.mode?.toLowerCase();
            const isPublic = cfg.visibility?.public === "true";

            if (visibilityMode === "hidden" || visibilityMode === "linkonly" || !isPublic) {
                console.log(`Skipping hidden project: ${folder}`);
                continue;
            }

            // Build card
            createCard(folder, cfg, base);

        } catch (err) {
            console.warn(`Skipping ${folder} (No settings.cfg)`);
        }
    }
}

/* ---------------------------
   Extract Copyparty Folders
---------------------------- */
function extractFolders(html) {
    const folders = [];
    const folderRegex = /href="([^"?\/]+)\//gi;
    let m;
    while ((m = folderRegex.exec(html)) !== null) {
        const name = m[1];
        if (!name.startsWith(".")) folders.push(name);
    }
    return [...new Set(folders)];
}

/* ---------------------------
   Parse settings.cfg
---------------------------- */
function parseCfg(text) {
    const result = {};
    let section = "";

    text.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) return;

        if (line.startsWith("[") && line.endsWith("]")) {
            section = line.slice(1, -1);
            result[section] = {};
            return;
        }

        const eq = line.indexOf("=");
        if (eq !== -1) {
            const key = line.slice(0, eq).trim();
            let val = line.slice(eq + 1).trim();
            val = val.replace(/^"|"$/g, "");
            result[section][key] = val;
        }
    });

    return result;
}

/* ---------------------------
   Auto-detect .glb or .gltf
---------------------------- */
async function autoDetectModel(base, folder) {
    const html = await fetch(`${base}${folder}/`).then(r => r.text());
    const files = [];
    const fileRegex = /href="([^"]+)"/gi;
    let m;
    while ((m = fileRegex.exec(html)) !== null) {
        const f = m[1];
        if (!f.includes("/")) files.push(f);
    }

    return files.find(f => f.toLowerCase().endsWith(".glb") || f.toLowerCase().endsWith(".gltf"));
}

/* ---------------------------
   Create Card with Hover Rotation
---------------------------- */
async function createCard(folder, cfg, base) {
    const container = document.querySelector(".grid");

    let model = cfg?.files?.primary;
    if (!model) {
        model = await autoDetectModel(base, folder);
    }
    if (!model) {
        console.warn("No model found in", folder);
        return;
    }

    const thumb = cfg?.files?.thumbnail;

    const card = document.createElement("a");
    card.className = "card";
    card.href = `/ModelPage/PageV1/index.html?project=${encodeURIComponent(folder)}`;

    card.innerHTML = `
        <div class="model-wrapper">
            <model-viewer 
                src="${base}${folder}/${model}" 
                poster="${thumb ? base + folder + '/' + thumb : ''}"
                camera-controls 
                auto-rotate>
            </model-viewer>
        </div>
        <h3>${cfg?.meta?.name || folder}</h3>
    `;

    container.appendChild(card);

    const viewer = card.querySelector("model-viewer");

    // Hover-based rotation
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const xPercent = (e.clientX - rect.left) / rect.width;
        const yPercent = (e.clientY - rect.top) / rect.height;

        const azimuth = (xPercent - 0.5) * 180;   // left-right rotation
        const elevation = 75 - yPercent * 50;     // up-down rotation
        viewer.cameraOrbit = `${azimuth}deg ${elevation}deg 2.5m`;
    });

    card.addEventListener("mouseleave", () => {
        viewer.cameraOrbit = '0deg 75deg 2.5m';
    });
}

/* ---------------------------
   Start Loading
---------------------------- */
loadProjects();
