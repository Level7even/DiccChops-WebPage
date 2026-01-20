// NewWorlds.js - Dynamically generate loot cards from item folders with settings.cfg
const ITEMS_PATH = "./Items/";
const MANIFEST = ITEMS_PATH + "items.json";

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch " + url);
  return await res.text();
}

function parseCfg(text) {
  const out = {};
  text.split(/\r?\n/).forEach(line => {
    const eq = line.indexOf("=");
    if (eq > -1) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      out[key] = val;
    }
  });
  return out;
}

function createLootCard(item, iconUrl) {
  // Determine weapon class by folder or name
  let weaponClass = null;
  if (item.rarity && item.rarity.toLowerCase().includes("heavy")) weaponClass = "Heavy";
  else if (item.rarity && item.rarity.toLowerCase().includes("medium")) weaponClass = "Medium";
  else if (item.rarity && item.rarity.toLowerCase().includes("light")) weaponClass = "Light";
  else if (item.rarity && item.rarity.toLowerCase().includes("sniper")) weaponClass = "Sniper";
  if (!weaponClass && item.name) {
    if (/^(H-|MG|MGL|HAR|R-12|MLMG|MSMG|MSG|MAR)/.test(item.name)) weaponClass = "Heavy";
    else if (/^(L-|LPistol|LSMG|LCarbine|LShotgun)/.test(item.name)) weaponClass = "Light";
    else if (/^(M-|MAR|MSMG|MSG|MLMG)/.test(item.name)) weaponClass = "Medium";
    else if (/^(S-|S1|S2)/.test(item.name)) weaponClass = "Sniper";
  }
  let classAttr = weaponClass ? ` data-class="${weaponClass}"` : "";
  return `<div class="loot-card" data-rarity="${item.rarity}"${classAttr}>
    <div class="loot-icon"><img src="${iconUrl}" alt="icon" style="width:40px;height:40px;object-fit:contain;"></div>
    <div class="loot-name">${item.name}</div>
    <div class="loot-rarity">${item.rarity}</div>
    <div class="loot-desc">${item.desc}</div>
  </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const lootCards = document.getElementById("loot-cards");
  lootCards.innerHTML = "<div style='color:#aaa'>Loading items...</div>";
  try {
    const manifest = await fetch(MANIFEST).then(r => r.json());
    const cards = await Promise.all(manifest.map(async folder => {
      const cfgText = await fetchText(`${ITEMS_PATH}${folder}/settings.cfg`);
      const cfg = parseCfg(cfgText);
      const iconUrl = `${ITEMS_PATH}${folder}/${cfg.icon}`;
      return createLootCard(cfg, iconUrl);
    }));
    lootCards.innerHTML = cards.join("");
  } catch (e) {
    lootCards.innerHTML = `<div style='color:#f66'>Failed to load items: ${e.message}</div>`;
  }
});
