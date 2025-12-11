async function loadProjects() {
    const base = "https://copyparty.dankserver.net/diccchops/";

    // 1. Load Copyparty directory HTML
    const html = await fetch(base).then(r => r.text());

    // Extract folder names (Copyparty supports multiple formats)
    const folders = extractFolders(html);

    for (const folder of folders) {
        try {
            const cfgURL = `${base}${folder}/settings.cfg`;
            const cfgText = await fetch(cfgURL).then(r => {
                if (!r.ok) throw new Error();
                return r.text();
            });

            const cfg = parseCfg(cfgText);

            // Build card
            createCard(folder, cfg, base);

        } catch (err) {
            console.warn(`Skipping ${folder} (No settings.cfg)`);
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                           1. Extract Copyparty Folders                     */
/* -------------------------------------------------------------------------- */

function extractFolders(html) {
    const folders = [];

    // Matches <a href="FolderName/">
    const folderRegex = /href="([^"?\/]+)\//gi;

    let m;
    while ((m = folderRegex.exec(html)) !== null) {
        const name = m[1];
        if (!name.startsWith(".")) folders.push(name);
    }
    return [...new Set(folders)]; // remove dupes
}

/* -------------------------------------------------------------------------- */
/*                              2. CFG PARSER                                 */
/* -------------------------------------------------------------------------- */

function parseCfg(text) {
    const result = {};
    let section = "";

    text.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) return;

        // Section [meta], [files], ...
        if (line.startsWith("[") && line.endsWith("]")) {
            section = line.slice(1, -1);
            result[section] = {};
            return;
        }

        // Key = Value
        const eq = line.indexOf("=");
        if (eq !== -1) {
            const key = line.slice(0, eq).trim();
            let val = line.slice(eq + 1).trim();
            val = val.replace(/^"|"$/g, ""); // remove quotes
            result[section][key] = val;
        }
    });

    return result;
}

/* -------------------------------------------------------------------------- */
/*                              3. CREATE CARD                                */
/* -------------------------------------------------------------------------- */

async function createCard(folder, cfg, base) {
    const container = document.querySelector(".grid");

    // Try loading model: cfg.files.primary OR auto-detect
    let model = cfg?.files?.primary;

    if (!model) {
        model = await autoDetectModel(base, folder); // fallback
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
}

/* -------------------------------------------------------------------------- */
/*                        AUTO-DETECT .glb OR .gltf                           */
/* -------------------------------------------------------------------------- */

async function autoDetectModel(base, folder) {
    const html = await fetch(`${base}${folder}/`).then(r => r.text());

    const files = [];
    const fileRegex = /href="([^"]+)"/gi;
    let m;

    while ((m = fileRegex.exec(html)) !== null) {
        const f = m[1];
        if (!f.includes("/")) files.push(f);
    }

    return files.find(f => 
        f.toLowerCase().endsWith(".glb") ||
        f.toLowerCase().endsWith(".gltf")
    );
}


/* -------------------------------------------------------------------------- */

loadProjects();
