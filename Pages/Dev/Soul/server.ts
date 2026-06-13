import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { Soul, TradeOffer, TradeLog } from "./src/types.js"; // Note the ESM path, though esbuild handles it

// Dotenv configuration
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (e) {
    console.error("Failed to initialize Gemini. Falling back to local procedural calculations.", e);
  }
} else {
  console.log("No GEMINI_API_KEY found, running in procedural fallback mode.");
}

// IN-MEMORY DATABASE STATE (retained during server uptime)
import fs from "fs";
import crypto from "crypto";

const DB_FILE = path.join(process.cwd(), "db_store.json");

interface DBState {
  users: Record<string, {
    nickname: string;
    passwordHash: string;
    originalSoulId: string;
    createdAt: string;
    lastActiveAt?: string;
    stats: {
      tradesProposed: number;
      tradesCompleted: number;
      soulsSynthesized: number;
    }
  }>;
  souls: Soul[];
  trades: TradeOffer[];
  logs: TradeLog[];
  soulBank: Soul[];
  soulDealers: string[];
  burnedSouls: any[];
}

// IN-MEMORY DATABASE STATE WITH CLOUD RESILIENCE
let USERS: Record<string, any> = {};
let SOULS: Soul[] = [];
let TRADES: TradeOffer[] = [];
let LOGS: TradeLog[] = [];
let SOUL_BANK: Soul[] = [];
let SOUL_DEALERS: string[] = ["The Lost Dev", "Socrates"];
let BURNED_SOULS: any[] = [];

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function saveDB() {
  try {
    const data: DBState = {
      users: USERS,
      souls: SOULS,
      trades: TRADES,
      logs: LOGS,
      soulBank: SOUL_BANK,
      soulDealers: SOUL_DEALERS,
      burnedSouls: BURNED_SOULS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save database store:", err);
  }
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<DBState>;
      USERS = parsed.users || {};
      SOULS = parsed.souls || [];
      TRADES = parsed.trades || [];
      LOGS = parsed.logs || [];
      SOUL_BANK = parsed.soulBank || [];
      SOUL_DEALERS = parsed.soulDealers || ["The Lost Dev", "Socrates"];
      BURNED_SOULS = parsed.burnedSouls || [];
      console.log(`[Database Loaded] Users: ${Object.keys(USERS).length}, Souls: ${SOULS.length}, Burned: ${BURNED_SOULS.length}`);
    } else {
      console.log("[Database Init] No db_store.json found. Seeding original content...");
      initStore();
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load database store:", err);
    initStore();
  }
}

function classifySoul(s: Soul): 'Original' | 'New' | 'Faux' | 'Inherited' {
  if (
    s.isFaux || 
    s.originalOwner === "Faux Synthesizer" || 
    s.originalOwner === "Artificial Forge" ||
    (s.name && s.name.toLowerCase().startsWith("faux")) ||
    (s.name && s.name.toLowerCase().includes("replica"))
  ) {
    return 'Faux';
  }

  const systemOrigins = [
    "Cosmic Source", 
    "The Universe", 
    "Celestial Forge", 
    "Soul Bank", 
    "Divine Ledger Source", 
    "Void Cosmos"
  ];
  if (systemOrigins.includes(s.originalOwner)) {
    return 'New';
  }

  const origOwnerLower = s.originalOwner.toLowerCase();
  const currentOwnerLower = s.owner.toLowerCase();
  
  if (origOwnerLower === currentOwnerLower) {
    const userProfile = USERS[origOwnerLower];
    if (userProfile && userProfile.originalSoulId === s.id) {
       return 'Original';
    }
  }

  const originalOwnerProfile = USERS[origOwnerLower];
  if (originalOwnerProfile && originalOwnerProfile.originalSoulId === s.id) {
    return 'Inherited';
  }

  return 'New';
}

// Helper to append a lifecycle event to a soul's history list
function addSoulHistory(
  soul: Soul, 
  action: 'MANIFESTED' | 'TRADED' | 'BANK_RESTOCKED' | 'GRANTED_BY_DEALER' | 'MODIFIED' | 'BURN_PROCESSED' | 'TRADE_PROPOSED' | 'TRADE_REJECTED',
  fromOwner: string,
  toOwner: string,
  details: string,
  reason?: string
) {
  if (!soul.history) soul.history = [];
  const entry = {
    id: `hist-${action.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: action,
    actionType: action, // Compatibility with client
    timestamp: new Date().toISOString(), // Server generated timestamp
    fromOwner: fromOwner,
    byNickname: fromOwner, // Compatibility with client
    toOwner: toOwner,
    recipientNickname: toOwner, // Compatibility with client
    details: details,
    reason: reason || ""
  };
  soul.history.push(entry);
}

// Ensure history is initialized on every Soul
function ensureSoulHistory(soul: Soul): Soul {
  if (!soul.history || soul.history.length === 0) {
    soul.history = [
      {
        id: `hist-init-${soul.id}`,
        action: "MANIFESTED",
        actionType: "MANIFESTED",
        timestamp: soul.createdAt || new Date().toISOString(),
        fromOwner: "Divine Ledger Source",
        byNickname: "Divine Ledger Source",
        toOwner: soul.owner,
        recipientNickname: soul.owner,
        details: `Discovered and bound to ${soul.owner} during initial cosmic alignment.`
      }
    ];
  } else {
    // Gracefully normalize history lists for existing/older seeds
    soul.history = soul.history.map(item => ({
      ...item,
      actionType: item.actionType || item.action,
      byNickname: item.byNickname || item.fromOwner,
      recipientNickname: item.recipientNickname || item.toOwner
    }));
  }
  return soul;
}

// Seed souls - legendary and historic souls that belong to default NPCs
const SYSTEM_OWNERS = {
  SOCRATES: "Socrates",
  CLEOPATRA: "Cleopatra VII",
  NAPOLEON: "Napoleon Bonaparte",
  DRACULA: "Count Dracula",
  JOAN: "Joan of Arc",
  PROGRAMMER: "The Lost Dev"
};

const SEED_SOULS: Soul[] = [
  {
    id: "seed-socrates",
    owner: SYSTEM_OWNERS.SOCRATES,
    originalOwner: SYSTEM_OWNERS.SOCRATES,
    name: "Psyche of Deep Inquiry",
    archetype: "Celestial",
    alignment: "Neutral Good",
    purity: 92,
    weight: 42,
    power: 85,
    description: "An unexamined soul of pure dialectic. It constantly doubts its own outlines, glowing with a warm, inquisitive golden light that demands answers.",
    theme: "from-amber-100 to-yellow-300 text-amber-950 border-amber-400Shadow",
    createdAt: new Date().toISOString(),
    isCustom: false
  },
  {
    id: "seed-cleopatra",
    owner: SYSTEM_OWNERS.CLEOPATRA,
    originalOwner: SYSTEM_OWNERS.CLEOPATRA,
    name: "Crown of the Nile Starlight",
    archetype: "Stardust",
    alignment: "Chaotic Good",
    purity: 82,
    weight: 55,
    power: 96,
    description: "Spun from Egyptian desert heat, stardust, and sovereign statecraft. It commands absolute presence and refuses to submit to lesser contracts.",
    theme: "from-purple-900 via-indigo-950 to-teal-950 text-teal-100 border-indigo-400Shadow",
    createdAt: new Date().toISOString(),
    isCustom: false
  },
  {
    id: "seed-napoleon",
    owner: SYSTEM_OWNERS.NAPOLEON,
    originalOwner: SYSTEM_OWNERS.NAPOLEON,
    name: "Iron Conqueror's Hearth",
    archetype: "Infernal",
    alignment: "Lawful Evil",
    purity: 38,
    weight: 125,
    power: 91,
    description: "A compact nuclear reactor of absolute triumph and smoke. Packaged tight with the scent of gunpowder, burning paper, and cold iron ambitions.",
    theme: "from-red-950 to-orange-950 text-red-200 border-red-500Shadow",
    createdAt: new Date().toISOString(),
    isCustom: false
  },
  {
    id: "seed-dracula",
    owner: SYSTEM_OWNERS.DRACULA,
    originalOwner: SYSTEM_OWNERS.DRACULA,
    name: "Nocturnal Crimson Resonance",
    archetype: "Abyssal",
    alignment: "Chaotic Evil",
    purity: 12,
    weight: 195,
    power: 98,
    description: "A chilling, shadow-bound well of spiritual mass. It smells of dried cloves and old velvet, drawing ambient light into its heavy black core.",
    theme: "from-zinc-950 via-rose-950 to-neutral-950 text-rose-100 border-rose-900Shadow",
    createdAt: new Date().toISOString(),
    isCustom: false
  },
  {
    id: "seed-joan",
    owner: SYSTEM_OWNERS.JOAN,
    originalOwner: SYSTEM_OWNERS.JOAN,
    name: "Beacon of the Fiery Lily",
    archetype: "Celestial",
    alignment: "Lawful Good",
    purity: 99,
    weight: 15,
    power: 94,
    description: "An incandescent star of absolute belief. It sparkles with blinding silver ash, weightless yet unbreakable, refusing any worldly stain.",
    theme: "from-sky-100 via-blue-50 to-emerald-100 text-teal-950 border-teal-300Shadow",
    createdAt: new Date().toISOString(),
    isCustom: false
  },
  {
    id: "seed-programmer",
    owner: SYSTEM_OWNERS.PROGRAMMER,
    originalOwner: SYSTEM_OWNERS.PROGRAMMER,
    name: "Recursive Memory Leak",
    archetype: "Void",
    alignment: "Chaotic Neutral",
    purity: 55,
    weight: 73,
    power: 70,
    description: "Contains several hundred nested callbacks, structural references to undefined variables, and immense caffeine tension. Flickers in terminal-green.",
    theme: "from-neutral-950 to-stone-900 text-emerald-400 border-slate-700Shadow font-mono",
    createdAt: new Date().toISOString(),
    isCustom: false
  }
];

// Helper to reset databases to seed values
function initStore() {
  SOULS = [...SEED_SOULS];
  TRADES = [];
  LOGS = [
    {
      id: "log-seed-1",
      senderName: SYSTEM_OWNERS.CLEOPATRA,
      receiverName: SYSTEM_OWNERS.SOCRATES,
      offeredSoulName: "Queen's Golden Sceptre",
      receivedSoulName: "Philosopher's Doubt",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];
  SOUL_DEALERS = ["The Lost Dev", "Socrates"];
  
  // Seed the Soul Bank with ancient, gorgeous starter souls
  SOUL_BANK = [
    {
      id: "bank-primordial-spark",
      owner: "Soul Bank",
      originalOwner: "Cosmic Source",
      name: "Primordial Helium Spark",
      archetype: "Celestial",
      alignment: "Neutral Good",
      purity: 88,
      weight: 12,
      power: 75,
      description: "An ancient, hovering nucleus of cosmic helium. It is warm, weightless, and carries standard light loops for immediate spiritual alignment.",
      theme: "from-amber-100 via-yellow-50 to-orange-100 text-amber-955 border-amber-400Shadow",
      createdAt: new Date().toISOString(),
      isCustom: false,
      history: [
        {
          id: "hist-bank-1",
          action: "BANK_RESTOCKED",
          timestamp: new Date().toISOString(),
          fromOwner: "Void Cosmos",
          toOwner: "Soul Bank",
          details: "Drawn from primordial gas clouds to seed the bank reserves."
        }
      ]
    },
    {
      id: "bank-stardust",
      owner: "Soul Bank",
      originalOwner: "Cosmic Source",
      name: "Stardust Whispering Helix",
      archetype: "Stardust",
      alignment: "Chaotic Neutral",
      purity: 72,
      weight: 34,
      power: 80,
      description: "A neon strand of purple interstellar dust. It hums with dynamic waves of cosmic frequencies and is prepared for exchange into player vessels.",
      theme: "from-violet-950 via-purple-950 to-slate-950 text-indigo-100 border-violet-500Shadow",
      createdAt: new Date().toISOString(),
      isCustom: false,
      history: [
        {
          id: "hist-bank-2",
          action: "BANK_RESTOCKED",
          timestamp: new Date().toISOString(),
          fromOwner: "Void Cosmos",
          toOwner: "Soul Bank",
          details: "Harvested from dying supernova threads."
        }
      ]
    },
    {
      id: "bank-emerald-bloom",
      owner: "Soul Bank",
      originalOwner: "Cosmic Source",
      name: "Aetheric Spore Bloom",
      archetype: "Verdant",
      alignment: "Lawful Good",
      purity: 91,
      weight: 48,
      power: 65,
      description: "Infused with standard forest heartbeat, moisture, and sylvan spring glow. Ideal for tranquil spirits who have traded away their heavy egos.",
      theme: "from-emerald-950 to-teal-900 text-emerald-100 border-emerald-500Shadow",
      createdAt: new Date().toISOString(),
      isCustom: false,
      history: [
        {
          id: "hist-bank-3",
          action: "BANK_RESTOCKED",
          timestamp: new Date().toISOString(),
          fromOwner: "Void Cosmos",
          toOwner: "Soul Bank",
          details: "Cultivated in cosmic sylvan greenhouses."
        }
      ]
    },
    {
      id: "bank-abyssal-stone",
      owner: "Soul Bank",
      originalOwner: "Cosmic Source",
      name: "Obsidian Core Resonance",
      archetype: "Abyssal",
      alignment: "Neutral Evil",
      purity: 25,
      weight: 160,
      power: 90,
      description: "A dense, velvet-dark block of spiritual mass. It smells of volcanic stone and wet charcoal, soaking up ambient energy to sustain dynamic operations.",
      theme: "from-indigo-950 to-slate-900 text-purple-200 border-purple-800Shadow",
      createdAt: new Date().toISOString(),
      isCustom: false,
      history: [
        {
          id: "hist-bank-4",
          action: "BANK_RESTOCKED",
          timestamp: new Date().toISOString(),
          fromOwner: "Void Cosmos",
          toOwner: "Soul Bank",
          details: "Extruded from high-density trench rifts."
        }
      ]
    }
  ];

  // Seed standard NPC owner profiles
  USERS = {
    "socrates": {
      nickname: "Socrates",
      passwordHash: "system-npc",
      originalSoulId: "seed-socrates",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 2, tradesCompleted: 1, soulsSynthesized: 0 }
    },
    "cleopatra vii": {
      nickname: "Cleopatra VII",
      passwordHash: "system-npc",
      originalSoulId: "seed-cleopatra",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 1, tradesCompleted: 1, soulsSynthesized: 0 }
    },
    "napoleon bonaparte": {
      nickname: "Napoleon Bonaparte",
      passwordHash: "system-npc",
      originalSoulId: "seed-napoleon",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 0, tradesCompleted: 0, soulsSynthesized: 0 }
    },
    "count dracula": {
      nickname: "Count Dracula",
      passwordHash: "system-npc",
      originalSoulId: "seed-dracula",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 0, tradesCompleted: 0, soulsSynthesized: 0 }
    },
    "joan of arc": {
      nickname: "Joan of Arc",
      passwordHash: "system-npc",
      originalSoulId: "seed-joan",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 0, tradesCompleted: 0, soulsSynthesized: 0 }
    },
    "the lost dev": {
      nickname: "The Lost Dev",
      passwordHash: "system-npc",
      originalSoulId: "seed-programmer",
      createdAt: new Date().toISOString(),
      stats: { tradesProposed: 0, tradesCompleted: 0, soulsSynthesized: 0 }
    }
  };
}

loadDB();

// ======================== API ENDPOINTS ========================

// 1. Reset endpoint for easy testing
app.post("/api/reset", (req, res) => {
  initStore();
  saveDB();
  res.json({ success: true, message: "Spiritual ecosystem reset to cosmic seeds." });
});

// User Auth - Registration
app.post("/api/auth/register", (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.status(400).json({ error: "Nickname and password are required credentials." });
  }

  const normalized = nickname.trim().toLowerCase();
  if (USERS[normalized]) {
    return res.status(400).json({ error: "Spiritual nickname has already been claimed in this cycle." });
  }

  // Generate their unique Original Soul right now!
  const soulId = `soul-${nickname.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${Date.now()}`;
  
  // Choose standard beautiful default themes and elements
  const archetypes = ["Celestial", "Abyssal", "Chronos", "Verdant", "Stardust", "Infernal", "Void"];
  const dominantArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  
  // Decide theme
  let themeStr = "from-stone-800 to-stone-950 text-stone-100 border-neutral-700Shadow";
  if (dominantArchetype === "Celestial") themeStr = "from-amber-100 via-yellow-50 to-orange-100 text-amber-955 border-amber-400Shadow";
  else if (dominantArchetype === "Abyssal") themeStr = "from-indigo-950 to-slate-900 text-purple-200 border-purple-800Shadow";
  else if (dominantArchetype === "Chronos") themeStr = "from-stone-900 to-amber-900 text-yellow-105 text-orange-100 border-stone-700Shadow";
  else if (dominantArchetype === "Verdant") themeStr = "from-emerald-950 to-teal-900 text-emerald-100 border-emerald-500Shadow";
  else if (dominantArchetype === "Stardust") themeStr = "from-violet-950 via-purple-950 to-slate-950 text-indigo-100 border-violet-500Shadow";
  else if (dominantArchetype === "Infernal") themeStr = "from-red-950 to-orange-950 text-orange-200 border-red-700Shadow";
  else if (dominantArchetype === "Void") themeStr = "from-black via-zinc-900 to-slate-950 text-zinc-100 border-zinc-700Shadow font-mono";

  const originalSoul: Soul = {
    id: soulId,
    owner: nickname.trim(),
    originalOwner: nickname.trim(),
    name: `${nickname.trim()}'s Original Spark`,
    archetype: dominantArchetype as any,
    alignment: "True Neutral",
    purity: 50 + Math.floor(Math.random() * 30),
    weight: 20 + Math.floor(Math.random() * 80),
    power: 70 + Math.floor(Math.random() * 25), // Power percentage
    description: `The unique foundation starlight assigned to ${nickname.trim()} upon entering the psychic exchange ledger.`,
    theme: themeStr,
    createdAt: new Date().toISOString(),
    isCustom: true,
    history: [
      {
        id: `hist-manifest-${Date.now()}`,
        action: "MANIFESTED",
        timestamp: new Date().toISOString(),
        fromOwner: "Celestial Forge",
        toOwner: nickname.trim(),
        details: `Discovered and bound to ${nickname.trim()} during initial account creation.`
      }
    ]
  };

  SOULS.push(originalSoul);

  USERS[normalized] = {
    nickname: nickname.trim(),
    passwordHash: hashPassword(password),
    originalSoulId: soulId,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    stats: {
      tradesProposed: 0,
      tradesCompleted: 0,
      soulsSynthesized: 0
    }
  };

  saveDB();

  res.json({
    success: true,
    message: "Aetheric account manifested!",
    user: {
      nickname: nickname.trim(),
      originalSoulId: soulId
    }
  });
});

// User Auth - Login
app.post("/api/auth/login", (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.status(400).json({ error: "Nickname and password are required credentials." });
  }

  const normalized = nickname.trim().toLowerCase();
  const user = USERS[normalized];
  if (!user || user.passwordHash === "system-npc") {
    return res.status(401).json({ error: "No player owned such nickname in this cosmic ledger." });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid password key. Connection rejected." });
  }

  user.lastActiveAt = new Date().toISOString();
  saveDB();

  res.json({
    success: true,
    message: "Aetheric connection established!",
    user: {
      nickname: user.nickname,
      originalSoulId: user.originalSoulId
    }
  });
});

// Dynamic dashboard and stats endpoint
app.get("/api/dashboard/stats", (req, res) => {
  try {
    const totalActive = SOULS.length;
    
    let originalCount = 0;
    let newCount = 0;
    let fauxCount = 0;
    let inheritedCount = 0;
    
    SOULS.forEach(s => {
      const cls = classifySoul(s);
      if (cls === "Original") originalCount++;
      else if (cls === "New") newCount++;
      else if (cls === "Faux") fauxCount++;
      else if (cls === "Inherited") inheritedCount++;
    });

    const activeThresholdMs = 60 * 1000;
    const now = Date.now();
    const onlinePlayers = Object.values(USERS).filter(u => {
      if (u.passwordHash === "system-npc") return true;
      if (u.lastActiveAt) {
        return (now - new Date(u.lastActiveAt).getTime()) < activeThresholdMs;
      }
      return false;
    });

    const onlineCount = onlinePlayers.length;

    // Leaderboards
    const mostPowerful = [...SOULS]
      .sort((a,b) => (b.power || 0) - (a.power || 0))
      .slice(0, 5);

    const mostTraded = [...SOULS]
      .sort((a,b) => {
        const tradesA = a.history ? a.history.filter(h => h.action === "TRADED").length : 0;
        const tradesB = b.history ? b.history.filter(h => h.action === "TRADED").length : 0;
        return tradesB - tradesA;
      })
      .slice(0, 5);

    const countRarityValue = (power: number) => {
      if (power >= 95) return 4; // Mythic
      if (power >= 85) return 3; // Epic
      if (power >= 65) return 2; // Rare
      return 1; // Common
    };
    const rarest = [...SOULS]
      .sort((a,b) => {
        const rarityA = countRarityValue(a.power || 0);
        const rarityB = countRarityValue(b.power || 0);
        if (rarityB !== rarityA) {
          return rarityB - rarityA;
        }
        return (b.purity || 0) - (a.purity || 0); // tiebreaker on purity
      })
      .slice(0, 5);

    res.json({
      totalActive,
      originalCount,
      newCount,
      fauxCount,
      inheritedCount,
      onlineCount,
      mostPowerful,
      mostTraded,
      rarest,
      onlineList: onlinePlayers.map(u => u.nickname)
    });
  } catch (error) {
    console.error("Failed to compute dynamic dashboard stats:", error);
    res.status(500).json({ error: "Mental flow blocked while generating ledger statistics." });
  }
});

// 2. Get active list of all souls in existence (with dynamic activity tracking)
app.get("/api/ledger", (req, res) => {
  const nickname = req.query.nickname as string;
  if (nickname) {
    const norm = nickname.trim().toLowerCase();
    if (USERS[norm]) {
      USERS[norm].lastActiveAt = new Date().toISOString();
      saveDB();
    }
  }
  const decorated = SOULS.map(s => ({
    ...s,
    soulType: classifySoul(s) as any
  }));
  res.json({ souls: decorated });
});

// 3. Get all trades in the ledger
app.get("/api/trades", (req, res) => {
  res.json({ trades: TRADES });
});

// 4. Get trade logs (history)
app.get("/api/logs", (req, res) => {
  res.json({ logs: LOGS });
});

// 5. Procedural (fallback) soul generator
function generateProceduralSoul(nickname: string, archetype: string, purity: number, power: number, weight: number): {
  name: string;
  alignment: string;
  description: string;
  theme: string;
} {
  let name = "";
  let alignment = "True Neutral";
  let description = "";
  let theme = "from-slate-800 to-slate-950 text-slate-100 border-slate-700Shadow";

  if (purity >= 80) alignment = "Neutral Good";
  else if (purity >= 95) alignment = "Lawful Good";
  else if (purity <= 20) alignment = "Chaotic Evil";
  else if (purity <= 40) alignment = "Neutral Evil";
  else if (power >= 80) alignment = "Chaotic Neutral";

  const descriptiveNouns = {
    Celestial: { names: ["Beacon", "Ascent", "Halcyon Aura", "Seraph's Hope"], desc: "A bright, celestial warmth that floats softly and elevates the morale of anyone near it." },
    Abyssal: { names: ["Depth", "Shadow Resonance", "Tender Obsidian", "Void Call"], desc: "Deep, soothing dark energies that hum with hidden power, keeping secrets locked safe." },
    Chronos: { names: ["Ticking Gear", "Echo of Tomorrow", "Aura of Memory", "Temporal Core"], desc: "Constantly shifts between moments, preserving the timeline around your conscious vessel." },
    Verdant: { names: ["Spore Bloom", "Wild Growth", "Sylvan Tendril", "Whispering Forest"], desc: "Radiating fresh moss and spring sunlight. It pulses with natural, vegetative heartbeat." },
    Stardust: { names: ["Cosmic Comet", "Galaxy Strand", "Nebulous Flare", "Astro Spark"], desc: "Forged from dying stars, sparking with neon particles of silver gas and light-years of wanderlust." },
    Infernal: { names: ["Scorched Core", "Vesuvius Fire", "Bellowing Cinder", "Molten Desire"], desc: "Always sizzling at scorching temperatures. It crackles with raw, untamable ambitious static." },
    Void: { names: ["Null Point", "Singularity", "Empty Horizon", "Zen Echo"], desc: "Absolutely quiet, yet possessing strange negative gravity. Draws worries in and deletes them." }
  };

  const choiceSet = descriptiveNouns[archetype] || descriptiveNouns.Void;
  const chosenName = choiceSet.names[Math.floor(Math.random() * choiceSet.names.length)];
  name = `${nickname}'s ${chosenName}`;
  description = `${choiceSet.desc} Weighing exactly ${weight}g with Spark Power of ${power}%.`;

  // Themes
  const themes = {
    Celestial: "from-amber-100 via-yellow-50 to-orange-100 text-amber-950 border-amber-400Shadow",
    Abyssal: "from-indigo-950 to-slate-900 text-purple-200 border-purple-800Shadow",
    Chronos: "from-stone-900 to-amber-900 text-yellow-100 border-stone-700Shadow",
    Verdant: "from-emerald-950 to-teal-900 text-emerald-100 border-emerald-500Shadow",
    Stardust: "from-violet-950 via-purple-950 to-slate-950 text-indigo-100 border-violet-500Shadow",
    Infernal: "from-red-950 to-orange-950 text-orange-200 border-red-700Shadow",
    Void: "from-black via-zinc-900 to-slate-950 text-zinc-100 border-zinc-700Shadow font-mono"
  };
  theme = themes[archetype] || themes.Void;

  return { name, alignment, description, theme };
}

// 6. Manifest a new soul (quiz submit)
app.post("/api/manifest", async (req, res) => {
  try {
    const { nickname, quizAnswers } = req.body;
    if (!nickname || !quizAnswers || !Array.isArray(quizAnswers)) {
      return res.status(400).json({ error: "Nickname and quizAnswers are required." });
    }

    // Process quiz answers to determine base values
    let purity = 50;
    let power = 40;
    let weight = 100;
    const archetypeTally: { [key: string]: number } = {
      Celestial: 0, Abyssal: 0, Chronos: 0, Verdant: 0, Stardust: 0, Infernal: 0, Void: 0
    };

    // Simulate quiz analysis
    const QUIZ_QUESTIONS = [
      {
        id: 1,
        options: [
          { affinity: "Celestial", purity: 15, power: 10, weight: -5 },
          { affinity: "Stardust", purity: 10, power: 12, weight: 0 },
          { affinity: "Abyssal", purity: -15, power: 15, weight: 15 },
          { affinity: "Void", purity: 0, power: 8, weight: -20 }
        ]
      },
      {
        id: 2,
        options: [
          { affinity: "Verdant", purity: 12, power: 5, weight: 10 },
          { affinity: "Chronos", purity: 5, power: 15, weight: 5 },
          { affinity: "Infernal", purity: -10, power: 18, weight: -10 },
          { affinity: "Void", purity: -15, power: 25, weight: 20 }
        ]
      },
      {
        id: 3,
        options: [
          { affinity: "Verdant", purity: 15, power: 5, weight: 5 },
          { affinity: "Infernal", purity: -5, power: 20, weight: 10 },
          { affinity: "Stardust", purity: 10, power: 10, weight: -15 },
          { affinity: "Chronos", purity: 5, power: 10, weight: 10 }
        ]
      },
      {
        id: 4,
        options: [
          { affinity: "Celestial", purity: 20, power: 5, weight: 5 },
          { affinity: "Infernal", purity: -10, power: 15, weight: 25 },
          { affinity: "Abyssal", purity: -5, power: 10, weight: 15 },
          { affinity: "Void", purity: 5, power: 5, weight: -25 }
        ]
      }
    ];

    quizAnswers.forEach((ans: { questionId: number; selectedOptionIndex: number }) => {
      const question = QUIZ_QUESTIONS.find(q => q.id === ans.questionId);
      if (question) {
        const option = question.options[ans.selectedOptionIndex];
        if (option) {
          purity += option.purity;
          power += option.power;
          weight += option.weight;
          archetypeTally[option.affinity] = (archetypeTally[option.affinity] || 0) + 1;
        }
      }
    });

    // Clamp values
    purity = Math.max(1, Math.min(100, purity));
    power = Math.max(10, Math.min(100, power));
    weight = Math.max(8, Math.min(295, weight));

    // Find dominant archetype
    let dominantArchetype = "Void";
    let maxCount = -1;
    for (const [key, val] of Object.entries(archetypeTally)) {
      if (val > maxCount) {
        maxCount = val;
        dominantArchetype = key;
      }
    }

    let soulMeta = { name: "", alignment: "", description: "", theme: "" };

    if (ai) {
      try {
        const prompt = `You are a mystical, cosmic force that creates unique, poetic Human Soul cards for a trading game.
Given the following player details:
- Player Spiritual Nickname: "${nickname}"
- Dominant quiz archetype: "${dominantArchetype}"
- Spiritual purity points: ${purity}/100
- Spiritual fire power level: ${power}/100
- Spiritual mass weight: ${weight} grams

Generate a soul card definition containing:
1. "name": A creative, poetic, or humorously accurate 2-4 word title for this soul (e.g. "${nickname}'s Shattered Mirror", "${nickname}'s Smoldering Ember", "${nickname}'s Solar Breath"). Keep it evocative!
2. "alignment": A classic alignment string (e.g., "Neutral Good", "Chaotic Neutral", "Lawful Evil", "True Neutral", "Chaotic Good") reflecting the purity level (high purity = good, low = bad/chaotic, middle = lawful/neutral).
3. "description": A beautifully written, slightly ironic or highly profound 2-sentence poetic summary explaining this soul's divine core and cosmic destiny.
4. "theme": Pick EXACTLY one from these approved CSS theme strings based strictly on the dominant archetype:
   - "Celestial" -> "from-amber-100 via-yellow-50 to-orange-100 text-amber-950 border-amber-400Shadow"
   - "Abyssal" -> "from-indigo-950 to-slate-900 text-purple-200 border-purple-800Shadow"
   - "Chronos" -> "from-stone-900 to-amber-900 text-yellow-100 border-stone-700Shadow"
   - "Verdant" -> "from-emerald-950 to-teal-900 text-emerald-100 border-emerald-500Shadow"
   - "Stardust" -> "from-violet-950 via-purple-950 to-slate-950 text-indigo-100 border-violet-500Shadow"
   - "Infernal" -> "from-red-950 to-orange-950 text-orange-200 border-red-700Shadow"
   - "Void" -> "from-black via-zinc-900 to-slate-950 text-zinc-100 border-zinc-700Shadow font-mono"

Your JSON response must match this schema:
{
  "name": "string",
  "alignment": "string",
  "description": "string",
  "theme": "string"
}
Output ONLY raw, pure JSON. Do not add markdown backticks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                alignment: { type: Type.STRING },
                description: { type: Type.STRING },
                theme: { type: Type.STRING }
              },
              required: ["name", "alignment", "description", "theme"]
            }
          }
        });

        const text = response.text || "{}";
        const cleanJson = JSON.parse(text.trim());
        soulMeta = {
          name: cleanJson.name || `${nickname}'s Essense`,
          alignment: cleanJson.alignment || "True Neutral",
          description: cleanJson.description || "A custom fabricated soul.",
          theme: cleanJson.theme || "from-stone-800 to-stone-950 text-stone-100 border-neutral-700Shadow"
        };
      } catch (gem_error) {
        console.error("Gemini Soul Generator failed, falling back to procedural:", gem_error);
        soulMeta = generateProceduralSoul(nickname, dominantArchetype, purity, power, weight);
      }
    } else {
      soulMeta = generateProceduralSoul(nickname, dominantArchetype, purity, power, weight);
    }

    // Assemble new soul record
    const newSoul: Soul = {
      id: `soul-${nickname.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${Date.now()}`,
      owner: nickname,
      originalOwner: nickname,
      name: soulMeta.name,
      archetype: dominantArchetype as any,
      alignment: soulMeta.alignment,
      purity,
      weight,
      power,
      description: soulMeta.description,
      theme: soulMeta.theme,
      createdAt: new Date().toISOString(),
      isCustom: true,
      history: [
        {
          id: `hist-manifest-${Date.now()}`,
          action: "MANIFESTED",
          timestamp: new Date().toISOString(),
          fromOwner: "Celestial Forge",
          toOwner: nickname,
          details: `Manifested onto the ledger through cognitive questionnaire.`
        }
      ]
    };

    // Save to server database
    SOULS.push(newSoul);

    const userKey = nickname.trim().toLowerCase();
    if (USERS[userKey]) {
      if (!USERS[userKey].originalSoulId) {
        USERS[userKey].originalSoulId = newSoul.id;
      }
      USERS[userKey].lastActiveAt = new Date().toISOString();
    }
    saveDB();

    res.json({ soul: newSoul });
  } catch (error: any) {
    console.error("Manifest Soul error:", error);
    res.status(500).json({ error: error.message || "Could not manifest soul." });
  }
});

// 7. Propose a Trade
app.post("/api/propose-trade", async (req, res) => {
  try {
    const { senderName, senderSoulId, receiverName, receiverSoulId, reason } = req.body;

    if (!senderName || !senderSoulId || !receiverName || !receiverSoulId || !reason || !reason.trim()) {
      return res.status(400).json({ error: "Missing required details for trade: Sender, Receiver, souls, and a valid Reason for trade are required." });
    }

    // Find souls
    const senderSoul = SOULS.find(s => s.id === senderSoulId);
    const receiverSoul = SOULS.find(s => s.id === receiverSoulId);

    if (!senderSoul) {
      return res.status(404).json({ error: `Offered soul was not found.` });
    }
    if (!receiverSoul) {
      return res.status(404).json({ error: `Desired soul was not found.` });
    }

    // Validate ownership
    if (senderSoul.owner !== senderName) {
      return res.status(400).json({ error: `You do not own ${senderSoul.name}. It belongs to ${senderSoul.owner}.` });
    }
    if (receiverSoul.owner !== receiverName) {
      return res.status(400).json({ error: `Target soul ${receiverSoul.name} is no longer owned by ${receiverName}. It has been acquired by ${receiverSoul.owner}.` });
    }

    if (senderSoulId === receiverSoulId) {
      return res.status(400).json({ error: "Cannot trade a soul for itself." });
    }

    const isNPCTrade = Object.values(SYSTEM_OWNERS).includes(receiverName);

    if (isNPCTrade) {
      // NPC resolves IMMEDIATELY! We will use Gemini to formulate a beautiful, in-character response and trade decision!
      let accepted = false;
      let npcResponse = "";

      if (ai) {
        try {
          const prompt = `You are simulating a soul-trading decision and text response for the historic/mythical character "${receiverName}".
They currently own a mystical soul card called "${receiverSoul.name}" (Archetype: ${receiverSoul.archetype}, Purity: ${receiverSoul.purity}/100, Power: ${receiverSoul.power}/100, Description: "${receiverSoul.description}").

A player named "${senderName}" is proposing to trade their own soul in exchange:
- Soul Name: "${senderSoul.name}"
- Archetype: ${senderSoul.archetype}
- Purity: ${senderSoul.purity}/100
- Power: ${senderSoul.power}/100
- Weight: ${senderSoul.weight}g
- Description: "${senderSoul.description}"
- Player's Reason for Trade: "${reason}"

EVALUATE the trade based on ${receiverName}'s nature:
- Socrates: Interested in truth, wisdom, and intellectual curiosity. Enthusiastically accepts light/clean Celestial, Chronos, and Void souls with Purity > 50. Declines heavy, demonic, or fire souls (Infernal/Abyssal) unless they have interesting, deep philosophical descriptions.
- Cleopatra VII: Desires majesty, brilliance, starlight, charisma, and status (Stardust, Celestial). Likes power levels > 70. Rejects dull, boring Void or swampy Verdant souls.
- Napoleon Bonaparte: Hungry for dynamic fire, explosive ambition, command, or battlefield energy (Infernal, Abyssal). Wants power > 80. Dislikes highly pure Celestial or weak/inert souls of low power.
- Count Dracula: Desires dark shadow, silent hunger, massive spiritual density, and velvet death (Abyssal, Void, Infernal). Rejects Celestial, bright Stardust, and high Purity > 45.
- Joan of Arc: Radiant warrior of pure holy flame. Strictly requires absolute light, faith, or noble green growth (Celestial, Verdant). Strictly rejects high-impurity (Purity < 60) or dark elements (Abyssal/Infernal).
- The Lost Dev: Desires recursive loops, logical anomalies, and void spaces (Void, Chronos, Stardust). Fascinated by code jokes or weird descriptors. Rejects souls that have clean alignments or boring celestial themes.

Write a 1-sentence in-character response. Then output whether you accept or reject.
Your output must be valid JSON matching this schema:
{
  "accepted": boolean,
  "responseMessage": "A 1-sentence direct quote from the character explaining their choice."
}
Output raw JSON only. do not put markdown tags.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  accepted: { type: Type.BOOLEAN },
                  responseMessage: { type: Type.STRING }
                },
                required: ["accepted", "responseMessage"]
              }
            }
          });

          const resText = response.text || "{}";
          const parsed = JSON.parse(resText.trim());
          accepted = !!parsed.accepted;
          npcResponse = parsed.responseMessage || "";
        } catch (npcErr) {
          console.error("Failed to run Gemini NPC trading simulation. Fallback to basic rule engine:", npcErr);
          // Fallback rule-engine
          if (receiverName === SYSTEM_OWNERS.SOCRATES) {
            accepted = ["Celestial", "Chronos", "Void"].includes(senderSoul.archetype) && senderSoul.purity >= 50;
            npcResponse = accepted 
              ? "An intriguing consciousness you hold! Its purity warrants an exchange. Let us contemplate this swap." 
              : "To take a soul without examining its foundational virtue would be foolish. I must decline.";
          } else if (receiverName === SYSTEM_OWNERS.CLEOPATRA) {
            accepted = senderSoul.power >= 75 && ["Stardust", "Celestial", "Infernal"].includes(senderSoul.archetype);
            npcResponse = accepted
              ? "Ah, a spark of true brilliance and command! I shall permit this trade. Wear my starlight with honor."
              : "This soul lacks the solar radiance required to adorn my courts. Be gone with such mundane ether.";
          } else if (receiverName === SYSTEM_OWNERS.NAPOLEON) {
            accepted = senderSoul.power >= 70 && !["Celestial"].includes(senderSoul.archetype);
            npcResponse = accepted
              ? "A fiery soul of tremendous offensive weight! It will serve my spiritual legions well. Accepted!"
              : "This soul is far too timid! There is no artillery smoke or strategic sparks in this essence. Declined.";
          } else if (receiverName === SYSTEM_OWNERS.DRACULA) {
            accepted = senderSoul.purity < 50 && ["Abyssal", "Void", "Infernal"].includes(senderSoul.archetype);
            npcResponse = accepted
              ? "Mmm... I can taste the exquisite, heavy shadows within this vessel. Come, let us bind our darkness."
              : "Pah! This soul is blinded by angelic glare and holy light. It burns my senses. Take it away!";
          } else if (receiverName === SYSTEM_OWNERS.JOAN) {
            accepted = senderSoul.purity >= 75 && ["Celestial", "Verdant"].includes(senderSoul.archetype);
            npcResponse = accepted
              ? "The light of heaven burns brightly in your courage. Yes, let us wage a peaceful crusade together!"
              : "This soul is weighed down by deep shadows or selfish desires. I cannot carry it to the altar.";
          } else {
            accepted = senderSoul.weight % 2 === 0 || ["Void", "Chronos"].includes(senderSoul.archetype);
            npcResponse = accepted
              ? "Compilation successful. Swapping memory slots. Soul assigned to root."
              : "Error: Stack overflow or structural layout mismatch. Reverting operation.";
          }
        }
      } else {
        // Simple deterministic rule engine when Gemini is offline
        if (receiverName === SYSTEM_OWNERS.SOCRATES) {
          accepted = ["Celestial", "Chronos", "Void"].includes(senderSoul.archetype) && senderSoul.purity >= 50;
          npcResponse = accepted 
            ? "An intriguing consciousness you hold! Its purity warrants an exchange. Let us contemplate this swap." 
            : "To take a soul without examining its foundational virtue would be foolish. I must decline.";
        } else if (receiverName === SYSTEM_OWNERS.CLEOPATRA) {
          accepted = senderSoul.power >= 75 && ["Stardust", "Celestial", "Infernal"].includes(senderSoul.archetype);
          npcResponse = accepted
            ? "Ah, a spark of true brilliance and command! I shall permit this trade. Wear my starlight with honor."
            : "This soul lacks the solar radiance required to adorn my courts. Be gone with such mundane ether.";
        } else if (receiverName === SYSTEM_OWNERS.NAPOLEON) {
          accepted = senderSoul.power >= 70 && !["Celestial"].includes(senderSoul.archetype);
          npcResponse = accepted
            ? "A fiery soul of tremendous offensive weight! It will serve my spiritual legions well. Accepted!"
            : "This soul is far too timid! There is no artillery smoke or strategic sparks in this essence. Declined.";
        } else if (receiverName === SYSTEM_OWNERS.DRACULA) {
          accepted = senderSoul.purity < 50 && ["Abyssal", "Void", "Infernal"].includes(senderSoul.archetype);
          npcResponse = accepted
            ? "Mmm... I can taste the exquisite, heavy shadows within this vessel. Come, let us bind our darkness."
            : "Pah! This soul is blinded by angelic glare and holy light. It burns my senses. Take it away!";
        } else if (receiverName === SYSTEM_OWNERS.JOAN) {
          accepted = senderSoul.purity >= 75 && ["Celestial", "Verdant"].includes(senderSoul.archetype);
          npcResponse = accepted
            ? "The light of heaven burns brightly in your courage. Yes, let us wage a peaceful crusade together!"
            : "This soul is weighed down by deep shadows or selfish desires. I cannot carry it to the altar.";
        } else {
          accepted = senderSoul.weight % 2 === 0 || ["Void", "Chronos"].includes(senderSoul.archetype);
          npcResponse = accepted
            ? "Compilation successful. Swapping memory slots. Soul assigned to root."
            : "Error: Stack overflow or structural layout mismatch. Reverting operation.";
        }
      }

      // Execute Trade instantly if accepted
      if (accepted) {
        // Swap ownership of souls
        senderSoul.owner = receiverName;
        receiverSoul.owner = senderName;

        // Record completed trade to lifecycle history
        addSoulHistory(senderSoul, "TRADED", senderName, receiverName, `Traded memory slot with NPC ${receiverName} for '${receiverSoul.name}'.`, reason.trim());
        addSoulHistory(receiverSoul, "TRADED", receiverName, senderName, `Traded memory slot with traveler ${senderName} for '${senderSoul.name}'.`, reason.trim());

        // Log trade
        const logId = `log-${Date.now()}`;
        const newLog: TradeLog = {
          id: logId,
          senderName,
          receiverName,
          offeredSoulName: senderSoul.name,
          receivedSoulName: receiverSoul.name,
          timestamp: new Date().toISOString()
        };
        LOGS.unshift(newLog);

        // Record Completed Trade Offer
        const tradeId = `trade-${Date.now()}`;
        const finalTrade: TradeOffer = {
          id: tradeId,
          senderName,
          senderSoulId,
          senderSoulName: senderSoul.name,
          receiverName,
          receiverSoulId,
          receiverSoulName: receiverSoul.name,
          status: "ACCEPTED",
          reason: reason.trim(),
          responseMessage: npcResponse,
          createdAt: new Date().toISOString()
        };
        TRADES.unshift(finalTrade);
        saveDB();

        return res.json({
          success: true,
          status: "ACCEPTED",
          responseMessage: npcResponse,
          soulSwapped: true,
          log: newLog
        });
      } else {
        // Record Declined Trade Offer
        const tradeId = `trade-${Date.now()}`;
        const finalTrade: TradeOffer = {
          id: tradeId,
          senderName,
          senderSoulId,
          senderSoulName: senderSoul.name,
          receiverName,
          receiverSoulId,
          receiverSoulName: receiverSoul.name,
          status: "DECLINED",
          reason: reason.trim(),
          responseMessage: npcResponse,
          createdAt: new Date().toISOString()
        };
        TRADES.unshift(finalTrade);

        // Record declined trade status to lifecycle history
        addSoulHistory(senderSoul, "TRADE_REJECTED", senderName, receiverName, `Proposed trade for of "${receiverSoul.name}" was refused by NPC ${receiverName}. Reason: Refused.`, reason.trim());

        saveDB();

        return res.json({
          success: false,
          status: "DECLINED",
          responseMessage: npcResponse,
          soulSwapped: false
        });
      }
    } else {
      // It is a real player-to-player trade!
      // Create a PENDING trade proposal
      const tradeId = `trade-${Date.now()}`;
      const newOffer: TradeOffer = {
        id: tradeId,
        senderName,
        senderSoulId,
        senderSoulName: senderSoul.name,
        receiverName,
        receiverSoulId,
        receiverSoulName: receiverSoul.name,
        status: "PENDING",
        reason: reason.trim(),
        createdAt: new Date().toISOString()
      };

      // Record pending trade in both souls' immutable lifecycle logs
      addSoulHistory(senderSoul, "TRADE_PROPOSED", senderName, receiverName, `Direct swap contract proposed to ${receiverName} offering '${senderSoul.name}' for '${receiverSoul.name}'.`, reason.trim());
      addSoulHistory(receiverSoul, "TRADE_PROPOSED", senderName, receiverName, `Direct swap contract proposed by ${senderName} offering '${senderSoul.name}' for '${receiverSoul.name}'.`, reason.trim());

      TRADES.unshift(newOffer);
      saveDB();

      return res.json({
        success: true,
        status: "PENDING",
        message: "Your trade proposal has been dispatched to the target owner's Ledger inbox.",
        offer: newOffer
      });
    }
  } catch (err: any) {
    console.error("Propose Trade error:", err);
    res.status(500).json({ error: err.message || "Failed to make trade proposal." });
  }
});

// 8. Resolve real player trade (Accept / Decline)
app.post("/api/resolve-trade", (req, res) => {
  try {
    const { tradeId, action, resolverName } = req.body; // action: 'ACCEPT' or 'DECLINE'

    if (!tradeId || !action || !resolverName) {
      return res.status(400).json({ error: "Missing structural parameters: tradeId, action, and resolverName are required." });
    }

    const offer = TRADES.find(t => t.id === tradeId);
    if (!offer) {
      return res.status(404).json({ error: "Trade offer not found." });
    }

    if (offer.status !== "PENDING") {
      return res.status(400).json({ error: `This trade is already ${offer.status}.` });
    }

    if (offer.receiverName !== resolverName) {
      return res.status(403).json({ error: "Only the designated receiver can resolve this trade." });
    }

    const senderSoul = SOULS.find(s => s.id === offer.senderSoulId);
    const receiverSoul = SOULS.find(s => s.id === offer.receiverSoulId);

    if (!senderSoul || !receiverSoul) {
      offer.status = "DECLINED";
      offer.responseMessage = "One of the souls involved in this contract ceased to exist in this plane.";
      return res.status(400).json({ error: "One or both souls could not be located." });
    }

    // Verify ownerships are still valid at moment of acceptance
    if (senderSoul.owner !== offer.senderName) {
      offer.status = "DECLINED";
      offer.responseMessage = "The sender no longer possesses the offered soul.";
      return res.status(400).json({ error: "Offer invalid: the sender no longer owns their soul." });
    }
    if (receiverSoul.owner !== offer.receiverName) {
      offer.status = "DECLINED";
      offer.responseMessage = "The receiver no longer possesses the requested soul.";
      return res.status(400).json({ error: "Offer invalid: you no longer own the requested soul." });
    }

    if (action === "ACCEPT") {
      // Execute soul trade swapping
      senderSoul.owner = offer.receiverName;
      receiverSoul.owner = offer.senderName;

      // Swap history tracking using helper
      addSoulHistory(senderSoul, "TRADED", offer.senderName, offer.receiverName, `Swap contract completed between ${offer.senderName} and ${offer.receiverName}. Exchanged for '${receiverSoul.name}'.`, offer.reason);
      addSoulHistory(receiverSoul, "TRADED", offer.receiverName, offer.senderName, `Swap contract completed between ${offer.receiverName} and ${offer.senderName}. Exchanged for '${senderSoul.name}'.`, offer.reason);

      offer.status = "ACCEPTED";
      offer.responseMessage = "Trade completed successfully by agreement.";

      // Log trade
      const newLog: TradeLog = {
        id: `log-${Date.now()}`,
        senderName: offer.senderName,
        receiverName: offer.receiverName,
        offeredSoulName: senderSoul.name,
        receivedSoulName: receiverSoul.name,
        timestamp: new Date().toISOString()
      };
      LOGS.unshift(newLog);

      // Instantly cancel any other pending offers involving these specific souls, as ownership changed!
      TRADES.forEach(t => {
        if (t.id !== tradeId && t.status === "PENDING" &&
            (t.senderSoulId === offer.senderSoulId || t.receiverSoulId === offer.senderSoulId ||
             t.senderSoulId === offer.receiverSoulId || t.receiverSoulId === offer.receiverSoulId)) {
          t.status = "DECLINED";
          t.responseMessage = "Soul swapped hands in another transaction.";
          
          // Log automated rejection
          const sSoul = SOULS.find(s => s.id === t.senderSoulId);
          const rSoul = SOULS.find(s => s.id === t.receiverSoulId);
          if (sSoul) addSoulHistory(sSoul, "TRADE_REJECTED", t.senderName, t.receiverName, "Automated cancellation. Vessel was traded in another transaction.", t.reason);
          if (rSoul) addSoulHistory(rSoul, "TRADE_REJECTED", t.senderName, t.receiverName, "Automated cancellation. Vessel was traded in another transaction.", t.reason);
        }
      });

      saveDB();
      return res.json({ success: true, status: "ACCEPTED", offer });
    } else {
      offer.status = "DECLINED";
      offer.responseMessage = "The trade proposal was rejected by the owner.";

      // Log direct rejection to both bodies
      addSoulHistory(senderSoul, "TRADE_REJECTED", offer.senderName, offer.receiverName, `Swap contract declined by receiver ${offer.receiverName}.`, offer.reason);
      addSoulHistory(receiverSoul, "TRADE_REJECTED", offer.senderName, offer.receiverName, `Swap contract refused.`, offer.reason);

      saveDB();
      return res.json({ success: true, status: "DECLINED", offer });
    }
  } catch (err: any) {
    console.error("Resolve Trade error:", err);
    res.status(500).json({ error: err.message || "Could not resolve trade." });
  }
});

// Helper to generate a completely new soul for bank restocking
async function generateGenericMysticalSoul(): Promise<Soul> {
  const archetypes = ["Celestial", "Abyssal", "Chronos", "Verdant", "Stardust", "Infernal", "Void"];
  const arc = archetypes[Math.floor(Math.random() * archetypes.length)];
  const purity = Math.floor(Math.random() * 80) + 10;
  const power = Math.floor(Math.random() * 60) + 40;
  const weight = Math.floor(Math.random() * 180) + 20;

  let soulMeta = generateProceduralSoul("Cosmic Reserve", arc, purity, power, weight);

  if (ai) {
    try {
      const prompt = `You are a mystical cosmic force creating a beautiful, unowned Soul card for the Soul Bank.
Generate a cosmic soul card with:
- Archetype: "${arc}"
- Purity: ${purity}/100
- Power: ${power}/100
- Weight: ${weight}g

Create:
1. "name": A gorgeous, unowned title (e.g., "The Primordial Whisper", "Unwritten Galaxy Helix", "Ancient Clockwork Echo"). Do not use a person's name prefix.
2. "alignment": Standard matching alignment.
3. "description": A deep, poetic, or mystical sentence describing an ancient, unowned essence waiting for its vessel.
4. "theme": Corresponding CSS theme.

Response format MUST match this exact schema:
{
  "name": "string",
  "alignment": "string",
  "description": "string",
  "theme": "string"
}
Output raw JSON only. Do not add markdown backticks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              alignment: { type: Type.STRING },
              description: { type: Type.STRING },
              theme: { type: Type.STRING }
            },
            required: ["name", "alignment", "description", "theme"]
          }
        }
      });
      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed.name) {
        soulMeta = {
          name: parsed.name,
          alignment: parsed.alignment || "True Neutral",
          description: parsed.description || "An ancient, drifting spark of dynamic life.",
          theme: parsed.theme || "from-stone-800 to-stone-950 text-stone-100 border-neutral-700Shadow"
        };
      }
    } catch (e) {
      console.error("Failed to generate AI soul for bank, using procedural:", e);
    }
  }

  return {
    id: `soul-bank-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
    owner: "Soul Bank",
    originalOwner: "The Universe",
    name: soulMeta.name,
    archetype: arc as any,
    alignment: soulMeta.alignment,
    purity,
    weight,
    power,
    description: soulMeta.description,
    theme: soulMeta.theme,
    createdAt: new Date().toISOString(),
    isCustom: true,
    history: [
      {
        id: `hist-restock-${Date.now()}`,
        action: "BANK_RESTOCKED",
        timestamp: new Date().toISOString(),
        fromOwner: "Void Cosmos",
        toOwner: "Soul Bank",
        details: "Emanated directly into the Soul Bank registry."
      }
    ]
  };
}

// 10. Get Soul Bank Status & Dealers
app.get("/api/bank/status", (req, res) => {
  const populatedBank = SOUL_BANK.map(ensureSoulHistory);
  res.json({
    bankSouls: populatedBank,
    dealers: SOUL_DEALERS
  });
});

// 11. Toggle Player Dealer Status
app.post("/api/bank/toggle-dealer", (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: "Nickname is required to register dealer status." });
  }
  const idx = SOUL_DEALERS.indexOf(nickname);
  let feedback = "";
  if (idx !== -1) {
    SOUL_DEALERS.splice(idx, 1);
    feedback = "You have dissolved your earthly soul dealer license.";
  } else {
    SOUL_DEALERS.push(nickname);
    feedback = "You are now registered as an authorized Divine Soul Dealer!";
  }
  saveDB();
  res.json({ success: true, dealers: SOUL_DEALERS, message: feedback });
});

// 12. Restock the Soul Bank
app.post("/api/bank/restock", async (req, res) => {
  try {
    const { dealerName } = req.body;
    const newRestockedSoul = await generateGenericMysticalSoul();
    if (dealerName) {
      newRestockedSoul.history = [
        {
          id: `hist-restock-${Date.now()}`,
          action: "BANK_RESTOCKED",
          timestamp: new Date().toISOString(),
          fromOwner: "Void Cosmos",
          toOwner: "Soul Bank",
          details: `Invoked and submitted into the Bank by authorized Dealer [${dealerName}].`
        }
      ];
    }
    SOUL_BANK.push(newRestockedSoul);
    saveDB();
    res.json({ success: true, soul: ensureSoulHistory(newRestockedSoul) });
  } catch (error: any) {
    console.error("Restock error:", error);
    res.status(500).json({ error: error.message || "Failed to restock soul bank." });
  }
});

// 13. Claim / Request Soul from Dealer
app.post("/api/bank/claim", async (req, res) => {
  try {
    const { nickname, dealerName, soulId } = req.body;
    if (!nickname || !dealerName || !soulId) {
      return res.status(400).json({ error: "Required fields: nickname, dealerName, soulId." });
    }

    // Check if recipient currently owns 0 souls
    const userSouls = SOULS.filter(s => s.owner === nickname);
    if (userSouls.length > 0) {
      return res.status(400).json({ error: "You still hold active vessels! Bank aid is strictly reserved for those with 0 empty vessels." });
    }

    const soulIndex = SOUL_BANK.findIndex(s => s.id === soulId);
    if (soulIndex === -1) {
      return res.status(404).json({ error: "The targeted bank soul has already dissolved or been claimed." });
    }

    const targetSoul = SOUL_BANK[soulIndex];

    // Determine Dealer NPC feedback
    let comment = "Wear this fresh soul with honor, traveler.";

    const isNPCDealer = ["Socrates", "The Lost Dev"].includes(dealerName);
    if (isNPCDealer && ai) {
      try {
        const prompt = `You are playing the character "${dealerName}" acting as a cosmic Soul Dealer.
A player named "${nickname}" has traded away all their previous souls and has absolutely NO spiritual vessels left (0 souls).
You are granting them a beautiful replacement soul from the Soul Bank:
- Soul Name: "${targetSoul.name}" (Archetype: ${targetSoul.archetype}, Alignment: ${targetSoul.alignment})

Write a 1-sentence supportive, poetic, or funny character statement about giving them this new beginning.
Output raw JSON only:
{
  "comment": "your character statement here"
}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                comment: { type: Type.STRING }
              },
              required: ["comment"]
            }
          }
        });
        const parsed = JSON.parse(response.text?.trim() || "{}");
        if (parsed.comment) comment = parsed.comment;
      } catch (err) {
        console.error("AI comment failed, fallback:", err);
        if (dealerName === "Socrates") {
          comment = "An empty life is rich with potential for new wisdom. Here, investigate this spark.";
        } else {
          comment = "Patch installed. Initialized fresh kernel thread for traveler container.";
        }
      }
    } else {
      if (dealerName === "Socrates") {
        comment = "An empty life is rich with potential for new wisdom. Here, investigate this spark.";
      } else if (dealerName === "The Lost Dev") {
        comment = "Patch installed. Initialized fresh kernel thread for traveler container.";
      }
    }

    // Process Transfer
    SOUL_BANK.splice(soulIndex, 1);
    targetSoul.owner = nickname;

    if (!targetSoul.history) targetSoul.history = [];
    targetSoul.history.push({
      id: `hist-claim-${Date.now()}`,
      action: "GRANTED_BY_DEALER",
      timestamp: new Date().toISOString(),
      fromOwner: "Soul Bank",
      toOwner: nickname,
      details: `Granted by Soul Dealer [${dealerName}] after trading away previous vessels. Feedback statement: "${comment}"`
    });

    SOULS.push(targetSoul);

    // Sync log for standard Chronicles tab too!
    const logId = `log-claim-${Date.now()}`;
    const newLog: TradeLog = {
      id: logId,
      senderName: `Soul Bank (via ${dealerName})`,
      receiverName: nickname,
      offeredSoulName: targetSoul.name,
      receivedSoulName: "Void",
      timestamp: new Date().toISOString()
    };
    LOGS.unshift(newLog);
    saveDB();

    res.json({
      success: true,
      soul: ensureSoulHistory(targetSoul),
      comment
    });

  } catch (error: any) {
    console.error("Claim error:", error);
    res.status(500).json({ error: error.message || "Failed to claim bank soul." });
  }
});

// 14. Direct Dealer Grant (lets active player dealers push a soul to needy players)
app.post("/api/bank/grant", (req, res) => {
  const { dealerName, recipientNickname, soulId } = req.body;
  if (!dealerName || !recipientNickname || !soulId) {
    return res.status(400).json({ error: "Missing fields: dealerName, recipientNickname, soulId." });
  }

  // Verify dealerName is a Soul Dealer
  if (!SOUL_DEALERS.includes(dealerName)) {
    return res.status(403).json({ error: "You are not registered as an authorized Soul Dealer." });
  }

  // Verify recipient owns 0 souls
  const targetUserSouls = SOULS.filter(s => s.owner === recipientNickname);
  if (targetUserSouls.length > 0) {
    return res.status(400).json({ error: `${recipientNickname} still holds active vessels and does not qualify for soul bank aid.` });
  }

  const soulIndex = SOUL_BANK.findIndex(s => s.id === soulId);
  if (soulIndex === -1) {
    return res.status(404).json({ error: "Chosen bank soul is no longer available in Bank." });
  }

  const targetSoul = SOUL_BANK[soulIndex];
  SOUL_BANK.splice(soulIndex, 1);
  targetSoul.owner = recipientNickname;

  if (!targetSoul.history) targetSoul.history = [];
  targetSoul.history.push({
    id: `hist-grant-${Date.now()}`,
    action: "GRANTED_BY_DEALER",
    timestamp: new Date().toISOString(),
    fromOwner: "Soul Bank",
    toOwner: recipientNickname,
    details: `Directly granted by human Soul Dealer [${dealerName}] to restore spiritual capacity.`
  });

  SOULS.push(targetSoul);

  // Sync log
  const logId = `log-grant-${Date.now()}`;
  const newLog: TradeLog = {
    id: logId,
    senderName: `Soul Bank (via ${dealerName})`,
    receiverName: recipientNickname,
    offeredSoulName: targetSoul.name,
    receivedSoulName: "Void Space",
    timestamp: new Date().toISOString()
  };
  LOGS.unshift(newLog);
  saveDB();

  res.json({
    success: true,
    message: `Soul "${targetSoul.name}" successfully granted to ${recipientNickname}.`,
    soul: ensureSoulHistory(targetSoul)
  });
});

// 15. Fabricate / Replicate a Faux Soul
app.post("/api/replicate", (req, res) => {
  const { soulId, nickname } = req.body;
  if (!soulId || !nickname) {
    return res.status(400).json({ error: "Missing soulId or nickname." });
  }

  // Find original soul
  const originalSoul = SOULS.find(s => s.id === soulId);
  if (!originalSoul) {
    return res.status(404).json({ error: "Target soul to replicate not found." });
  }

  // Ensure nickname currently owns the original soul
  if (originalSoul.owner !== nickname) {
    return res.status(403).json({ error: "You can only replicate souls currently in your possession." });
  }

  // Generate Replicated Soul (marked with isFaux: true)
  const replicaId = `soul-faux-${Math.random().toString(36).substring(2, 8)}-${Date.now()}`;
  const replicatedSoul: Soul = {
    id: replicaId,
    owner: nickname,
    originalOwner: "Faux Synthesizer", 
    name: `Faux ${originalSoul.name}`,
    archetype: originalSoul.archetype,
    alignment: `Artificial ${originalSoul.alignment}`,
    purity: Math.max(1, Math.min(100, Math.floor(originalSoul.purity * 0.85))), // slightly lower purity out of artificial resonance
    weight: Math.min(295, Math.floor(originalSoul.weight * 1.15)), // artificial souls are slightly heavier/burdened
    power: Math.max(10, Math.min(100, Math.floor(originalSoul.power * 0.9))), // slightly decayed power
    description: `An artificially synthesized, simulated clone of "${originalSoul.name}". Lacks a generic natural thread but holds perfect visual mirroring.`,
    theme: originalSoul.theme,
    createdAt: new Date().toISOString(),
    isCustom: true,
    isFaux: true,
    soulType: 'Faux',
    history: [
      {
        id: `hist-replicate-${Date.now()}`,
        action: "MANIFESTED" as any,
        timestamp: new Date().toISOString(),
        fromOwner: "Artificial Forge",
        toOwner: nickname,
        details: `Synthesized as an artificial clone copy of original soul "${originalSoul.name}" (ID: ${originalSoul.id}).`
      }
    ]
  };

  SOULS.push(replicatedSoul);

  // Sync log
  const newReplicateLog: TradeLog = {
    id: `log-replicate-${Date.now()}`,
    senderName: "Faux Synthesizer",
    receiverName: nickname,
    offeredSoulName: `Faux Clone of ${originalSoul.name}`,
    receivedSoulName: "Void Manifest",
    timestamp: new Date().toISOString()
  };
  LOGS.unshift(newReplicateLog);
  const userKey = nickname.toLowerCase().trim();
  if (USERS[userKey]) {
    USERS[userKey].stats.soulsSynthesized = (USERS[userKey].stats.soulsSynthesized || 0) + 1;
  }
  saveDB();

  res.json({
    success: true,
    soul: replicatedSoul,
    message: `Successfully synthesized artificial copy: "${replicatedSoul.name}"!`
  });
});

// 16. Burn and incinerate a faux/artificial soul permanently
app.post("/api/burn", (req, res) => {
  try {
    const { soulId, nickname, reason } = req.body;
    if (!soulId || !nickname || !reason || !reason.trim()) {
      return res.status(400).json({ error: "Missing required details: soulId, nickname, and reason are required to process spiritual burning." });
    }

    const soul = SOULS.find(s => s.id === soulId);
    if (!soul) {
      return res.status(404).json({ error: "Target soul card could not be located in active existence." });
    }

    if (soul.owner !== nickname) {
      return res.status(403).json({ error: "You cannot burn a soul that you do not own." });
    }

    const category = classifySoul(soul);
    if (category !== 'Faux' && !soul.isFaux) {
      return res.status(400).json({ error: "Spiritual Safety Protocols: Only artificially replicated 'Faux' souls can be safely burned and destroyed. Original or Inherited spark lines are protected from incinerator furnaces." });
    }

    // Capture lifecycle entry on the soul snapshot itself prior to destruction so history logs the event
    addSoulHistory(soul, "BURN_PROCESSED", nickname, "Void Furnace", `Incinerated and permanently destroyed in the Void Furnace. Reason: ${reason.trim()}`, reason.trim());

    // Permanently remove from database active souls list
    SOULS = SOULS.filter(s => s.id !== soulId);

    // Save detailed record of the burned soul in Pyre Registers
    const burnLog = {
      id: `burn-${Date.now()}`,
      soulId: soul.id,
      soulName: soul.name,
      owner: nickname,
      timestamp: new Date().toISOString(), // Server generated timestamp
      reason: reason.trim(),
      soulSnapshot: soul // Saved snapshot holding full stats and complete history logs
    };
    BURNED_SOULS.unshift(burnLog);

    // Append to general Ledger Chronicles as well
    const burnSystemLog: TradeLog = {
      id: `log-burn-${Date.now()}`,
      senderName: nickname,
      receiverName: "Void Furnace",
      offeredSoulName: soul.name,
      receivedSoulName: "Void Ashes",
      timestamp: new Date().toISOString()
    };
    LOGS.unshift(burnSystemLog);

    saveDB();

    res.json({
      success: true,
      message: `Soul card "${soul.name}" has been permanently incinerated. It is now unrecoverable ashes in the void space.`,
      burnLog
    });
  } catch (error: any) {
    console.error("Burn Process error:", error);
    res.status(500).json({ error: error.message || "Failed to burn soul card." });
  }
});

// 16.5 Alchemical Soul Exchange & Trade Desk
app.post("/api/bank/exchange", async (req, res) => {
  try {
    const { nickname, offeredSoulId, targetSoulId, fauxSacrificeIds } = req.body;
    if (!nickname || !offeredSoulId || !targetSoulId) {
      return res.status(400).json({ error: "Missing required arguments: nickname, offeredSoulId, targetSoulId." });
    }

    const userKey = nickname.toLowerCase().trim();
    const user = USERS[userKey];
    if (!user) {
      return res.status(404).json({ error: "Traveler profile not found in active registries." });
    }

    // Find the primary offered soul in active player souls
    const offeredSoul = SOULS.find(s => s.id === offeredSoulId && s.owner === nickname);
    if (!offeredSoul) {
      return res.status(404).json({ error: "The primary soul offered for exchange is not currently inside your vessel collection." });
    }

    // Determine if the offered soul is Faux/Artificial
    const isFauxOffered = offeredSoul.isFaux || offeredSoul.soulType === 'Faux' || offeredSoul.originalOwner === "Faux Synthesizer";

    // Build the collection of souls to be consumed/removed from user
    let soulsToRemove = [offeredSoulId];

    if (isFauxOffered) {
      // Must sacrifice 2 other Faux souls
      if (!fauxSacrificeIds || !Array.isArray(fauxSacrificeIds) || fauxSacrificeIds.length !== 2) {
        return res.status(400).json({ error: "Alchemical Restriction: Exchanging a Faux copy requires sacrificing exactly 2 other Faux souls as high-energy fuel." });
      }

      const distinctSacrifices = Array.from(new Set(fauxSacrificeIds));
      if (distinctSacrifices.length !== 2) {
        return res.status(400).json({ error: "Alchemical Restriction: Sacrifice souls must be distinct and non-duplicated entities." });
      }

      for (const sacId of distinctSacrifices) {
        if (sacId === offeredSoulId) {
          return res.status(400).json({ error: "Alchemical Restriction: A sacrifice soul cannot be the same as the primary exchange target." });
        }
        const sacSoul = SOULS.find(s => s.id === sacId && s.owner === nickname);
        if (!sacSoul) {
          return res.status(404).json({ error: "One of your selected sacrifice souls could not be located in your collection." });
        }
        const isSacFaux = sacSoul.isFaux || sacSoul.soulType === 'Faux' || sacSoul.originalOwner === "Faux Synthesizer";
        if (!isSacFaux) {
          return res.status(400).json({ error: `Sacrifice soul "${sacSoul.name}" is a Real organic soul! Organic souls cannot be consumed as raw alchemical fuel. Use Faux copies instead.` });
        }
        soulsToRemove.push(sacId);
      }
    }

    // Resolve what the user gets in return
    let newlyAcquiredSoul: Soul;
    if (targetSoulId === "random") {
      newlyAcquiredSoul = await generateGenericMysticalSoul();
      newlyAcquiredSoul.owner = nickname;
      newlyAcquiredSoul.history = [
        {
          id: `hist-exch-${Date.now()}`,
          action: "TRADED",
          timestamp: new Date().toISOString(),
          fromOwner: "Celestial Alchemist",
          toOwner: nickname,
          details: `Forged as a pristine brand new random energy wave, traded for "${offeredSoul.name}".`
        }
      ];
    } else {
      const bankIndex = SOUL_BANK.findIndex(s => s.id === targetSoulId);
      if (bankIndex === -1) {
        return res.status(404).json({ error: "The chosen exchange target is no longer present in the Bank Reserves. Re-synchronize." });
      }

      const rawTarget = SOUL_BANK[bankIndex];
      SOUL_BANK.splice(bankIndex, 1); // Extract from bank

      newlyAcquiredSoul = {
        ...rawTarget,
        owner: nickname,
        history: [
          ...(rawTarget.history || []),
          {
            id: `hist-exch-${Date.now()}`,
            action: "TRADED",
            timestamp: new Date().toISOString(),
            fromOwner: "Soul Bank Registry",
            toOwner: nickname,
            details: `Acquired in an alchemical swap by traveler ${nickname}. Offered: "${offeredSoul.name}".`
          }
        ]
      };
    }

    // Execute state alterations! Remove the old souls, add the new soul.
    SOULS = SOULS.filter(s => !soulsToRemove.includes(s.id));

    // If they offered a REAL soul, it goes back into the Soul Bank reserves for others!
    if (!isFauxOffered) {
      offeredSoul.owner = "Soul Bank";
      offeredSoul.history = [
        ...(offeredSoul.history || []),
        {
          id: `hist-exch-ret-${Date.now()}`,
          action: "TRADED",
          timestamp: new Date().toISOString(),
          fromOwner: nickname,
          toOwner: "Soul Bank",
          details: `Traded-in and deposited back to public reserves by traveler ${nickname}.`
        }
      ];
      SOUL_BANK.push(offeredSoul);
    } else {
      // It is a Faux soul, so it is permanently destroyed/sacrificed in the trade desk alchemical reaction
      for (const idToBurn of soulsToRemove) {
        const targetBurn = idToBurn === offeredSoulId ? offeredSoul : SOULS.find(s => s.id === idToBurn);
        if (targetBurn) {
          const burnLog = {
            id: `burn-exch-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
            soulId: targetBurn.id,
            soulName: targetBurn.name,
            owner: nickname,
            timestamp: new Date().toISOString(),
            reason: "Demolished in the Exchange Desk reactor as an alchemical sacrifice.",
            soulSnapshot: targetBurn
          };
          BURNED_SOULS.unshift(burnLog);
        }
      }
    }

    // Push the fresh soul to active user's inventory
    SOULS.push(newlyAcquiredSoul);

    // Dynamic logging
    const exchangeLog: TradeLog = {
      id: `log-exch-${Date.now()}`,
      senderName: nickname,
      receiverName: "Alchemical Exchanges",
      offeredSoulName: offeredSoul.name + (isFauxOffered ? " (and 2 Faux Fuel Sacrifices)" : ""),
      receivedSoulName: newlyAcquiredSoul.name,
      timestamp: new Date().toISOString()
    };
    LOGS.unshift(exchangeLog);

    saveDB();

    res.json({
      success: true,
      message: isFauxOffered 
        ? `Alchemy complete! You traded "${offeredSoul.name}" (+2 Faux fuel sources) for "${newlyAcquiredSoul.name}".`
        : `Sacred Lineage traded! You exchanged your precious Organic Spark "${offeredSoul.name}" for "${newlyAcquiredSoul.name}".`,
      soul: ensureSoulHistory(newlyAcquiredSoul),
      bankSouls: SOUL_BANK.map(ensureSoulHistory)
    });

  } catch (error: any) {
    console.error("Alchemy Exchange error:", error);
    res.status(500).json({ error: error.message || "Failed to process alchemical swap." });
  }
});

// 17. Cosmic Admin Observatory Registry
app.get("/api/admin/observatory", (req, res) => {
  try {
    const nickname = (req.query.nickname as string || "").trim().toLowerCase();
    if (nickname !== "hsiman335@outlook" && nickname !== "diccchops") {
      return res.status(403).json({ error: "Access Denied: You do not possess the required cosmic credentials to view the admin observatory." });
    }

    // Gather statistics
    const stats = {
      totalActiveSouls: SOULS.length,
      totalBurnedSouls: BURNED_SOULS.length,
      totalTradesRecorded: TRADES.length,
      totalUsersCount: Object.keys(USERS).length
    };

    res.json({
      stats,
      users: Object.values(USERS).map(u => ({
        nickname: u.nickname,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        stats: u.stats || { tradesProposed: 0, tradesCompleted: 0, soulsSynthesized: 0 }
      })),
      trades: TRADES,
      burned: BURNED_SOULS,
      activeSouls: SOULS
    });
  } catch (error: any) {
    console.error("Admin Observatory registry error:", error);
    res.status(500).json({ error: error.message || "Could not retrieve observatory data." });
  }
});

// Integrated Vite Middleware / static routing
const __filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const __dirname = __filename ? path.dirname(__filename) : "";

if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Cosmic Server] Running on http://localhost:${PORT}`);
});
