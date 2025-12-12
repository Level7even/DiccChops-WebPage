const base = "https://copyparty.dankserver.net/diccchops/";

async function loadProjects() {
    const html = await fetch(base).then(r => r.text());
    const folders = extractFolders(html);

    for (const folder of folders) {
        try {
            const cfgURL = `${base}${folder}/settings.cfg`;
            const cfgText = await fetch(cfgURL).then(r => {
                if (!r.ok) throw new Error();
                return r.text();
            });

            const cfg = parseCfg(cfgText);

            const visibilityMode = cfg.visibility?.mode?.toLowerCase();
            const isPublic = cfg.visibility?.public === "true";

            if (visibilityMode === "hidden" || visibilityMode === "linkonly" || !isPublic) {
                continue;
            }

            createCard(folder, cfg, base);

        } catch (err) {
            console.warn(`Skipping ${folder} (No settings.cfg)`);
        }
    }
}

/* --------------------------- */

function extractFolders(html) {
    const out = [];
    const reg = /href="([^"?\/]+)\//gi;
    let m;
    while ((m = reg.exec(html)) !== null) {
        if (!m[1].startsWith(".")) out.push(m[1]);
    }
    return [...new Set(out)];
}

/* --------------------------- */

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

/* --------------------------- */

async function autoDetectModel(base, folder) {
    const html = await fetch(`${base}${folder}/`).then(r => r.text());
    const files = [];
    const reg = /href="([^"]+)"/gi;
    let m;
    while ((m = reg.exec(html)) !== null) {
        const f = m[1];
        if (!f.includes("/")) files.push(f);
    }

    return files.find(f =>
        f.toLowerCase().endsWith(".glb") ||
        f.toLowerCase().endsWith(".gltf")
    );
}

/* ----------------------------------------------------------
   Smooth Hover Rotation (NO SNAP, CORRECT PC DIRECTION)
----------------------------------------------------------- */
function enableSmoothRotation(card, viewer) {
    let targetAz = 0;
    let targetEl = 75;
    let currentAz = 0;
    let currentEl = 75;

    let animating = false;

    function animate() {
        currentAz += (targetAz - currentAz) * 0.12;
        currentEl += (targetEl - currentEl) * 0.12;

        viewer.cameraOrbit = `${currentAz}deg ${currentEl}deg auto`;

        if (Math.abs(currentAz - targetAz) > 0.05 ||
            Math.abs(currentEl - targetEl) > 0.05) {
            requestAnimationFrame(animate);
        } else {
            animating = false;
        }
    }

    card.addEventListener("mouseenter", () => {
        viewer.autoRotate = false;
    });

    card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // FIXED: correct horizontal rotation direction for PC
        targetAz = -(x - 0.5) * 120;
        targetEl = 70 - y * 30;

        if (!animating) {
            animating = true;
            requestAnimationFrame(animate);
        }
    });

    card.addEventListener("mouseleave", () => {
        viewer.autoRotate = true;
    });
}

/* --------------------------- */

async function createCard(folder, cfg, base) {
    const container = document.querySelector(".grid");

    let model = cfg?.files?.primary;
    if (!model) model = await autoDetectModel(base, folder);
    if (!model) return;

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
                auto-rotate
                disable-zoom>
            </model-viewer>
        </div>
        <h3>${cfg?.meta?.name || folder}</h3>
    `;

    container.appendChild(card);

    const viewer = card.querySelector("model-viewer");

    enableSmoothRotation(card, viewer);
}

/* --------------------------- */

loadProjects();
