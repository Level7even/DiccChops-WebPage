import React from "react";
import { Soul } from "../types";
import { 
  Sparkles, 
  Sun, 
  Flame, 
  Eye, 
  Clock, 
  Leaf, 
  Atom, 
  User, 
  Anchor, 
  Cpu, 
  Lock
} from "lucide-react";
import { motion } from "motion/react";

interface SoulCardProps {
  soul: Soul;
  selected?: boolean;
  onSelect?: () => void;
  hoverable?: boolean;
  actionButtonLabel?: string;
  onActionButtonClick?: (e: React.MouseEvent) => void;
  disabledActions?: boolean;
  currentUserNickname?: string;
  onViewHistory?: (e: React.MouseEvent) => void;
}

export default function SoulCard({
  soul,
  selected = false,
  onSelect,
  hoverable = true,
  actionButtonLabel,
  onActionButtonClick,
  disabledActions = false,
  currentUserNickname,
  onViewHistory
}: SoulCardProps) {
  
  // Icon selector based on Archetype
  const getArchetypeIcon = (arc: string) => {
    switch (arc) {
      case "Celestial":
        return <Sun className="w-5 h-5 text-amber-400" id={`icon-sun-${soul.id}`} />;
      case "Abyssal":
        return <Eye className="w-5 h-5 text-purple-400" id={`icon-eye-${soul.id}`} />;
      case "Chronos":
        return <Clock className="w-5 h-5 text-stone-300" id={`icon-clock-${soul.id}`} />;
      case "Verdant":
        return <Leaf className="w-5 h-5 text-emerald-400" id={`icon-leaf-${soul.id}`} />;
      case "Stardust":
        return <Sparkles className="w-5 h-5 text-indigo-300" id={`icon-sparkles-${soul.id}`} />;
      case "Infernal":
        return <Flame className="w-5 h-5 text-rose-500" id={`icon-flame-${soul.id}`} />;
      case "Void":
      default:
        return <Atom className="w-5 h-5 text-zinc-400 animate-spin-slow" id={`icon-atom-${soul.id}`} />;
    }
  };

  // Determine is owned by current user
  const isSelfOwned = currentUserNickname && soul.owner === currentUserNickname;

  // Determine Rarity Badge based on power percentage
  const getRarityInfo = (power: number) => {
    if (power < 60) {
      return {
        name: "Common",
        classes: "bg-slate-500/15 text-slate-300 border-slate-500/25"
      };
    } else if (power < 80) {
      return {
        name: "Rare",
        classes: "bg-blue-500/15 text-blue-300 border-blue-500/25"
      };
    } else if (power < 95) {
      return {
        name: "Epic",
        classes: "bg-purple-500/20 text-purple-300 border-purple-500/30"
      };
    } else {
      return {
        name: "Mythic",
        classes: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/45 shadow-sm shadow-amber-950/30 animate-pulse font-extrabold"
      };
    }
  };

  // Determine Soul Type Badge
  const getSoulTypeInfo = () => {
    if (
      soul.isFaux || 
      soul.originalOwner === "Faux Synthesizer" || 
      soul.originalOwner === "Artificial Forge" ||
      soul.name.toLowerCase().startsWith("faux") ||
      soul.name.toLowerCase().includes("replica")
    ) {
      return {
        name: "Faux",
        classes: "bg-rose-500/20 text-rose-300 border-rose-500/30"
      };
    }

    const systemOrigins = [
      "Cosmic Source", 
      "The Universe", 
      "Celestial Forge", 
      "Soul Bank", 
      "Divine Ledger Source", 
      "Void Cosmos"
    ];
    
    if (systemOrigins.includes(soul.originalOwner)) {
      return {
        name: "New",
        classes: "bg-sky-500/20 text-sky-300 border-sky-500/30"
      };
    }

    if (soul.owner === soul.originalOwner) {
      return {
        name: "Original",
        classes: "bg-emerald-500/20 text-emerald-300 border-emerald-500/35"
      };
    }

    return {
      name: "Inherited",
      classes: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
    };
  };

  const rarity = getRarityInfo(soul.power);
  const soulType = soul.soulType ? {
    name: soul.soulType,
    classes: soul.soulType === 'Faux' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
             soul.soulType === 'New' ? "bg-sky-500/20 text-sky-300 border-sky-500/30" :
             soul.soulType === 'Original' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35" :
             "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
  } : getSoulTypeInfo();

  const tradeCount = soul.history ? soul.history.filter(h => h.action === "TRADED").length : 0;
  let legacyBadge = null;
  if (tradeCount >= 100) {
    legacyBadge = { name: "Legendary Legacy", classes: "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-yellow-250 border-yellow-500/40" };
  } else if (tradeCount >= 50) {
    legacyBadge = { name: "Ancient Legacy", classes: "bg-gradient-to-r from-red-500/25 to-rose-500/25 text-rose-250 border-rose-500/40" };
  } else if (tradeCount >= 10) {
    legacyBadge = { name: "Wanderer", classes: "bg-indigo-500/25 text-indigo-250 border-indigo-500/40" };
  } else if (tradeCount > 0) {
    legacyBadge = { name: "Active Soul", classes: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" };
  }

  const previousTrades = soul.history 
    ? soul.history.filter(h => h.action === "TRADED" && h.fromOwner)
    : [];
  const uniquePrevOwners = Array.from(new Set(previousTrades.map(t => t.fromOwner)));
  const traceSummary = uniquePrevOwners.length > 0
    ? uniquePrevOwners.slice(0, 2).join(" ➔ ") + (uniquePrevOwners.length > 2 ? "..." : "")
    : "Celestial Origin (untraded)";

  return (
    <motion.div
      id={`soul-card-container-${soul.id}`}
      whileHover={hoverable ? { y: -8, scale: 1.025 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onSelect}
      className={`relative w-full max-w-sm rounded-[24px] p-6 bg-gradient-to-b ${soul.theme} ${
        selected ? "ring-2 ring-violet-500 scale-102" : "border border-zinc-800"
      } ${onSelect ? "cursor-pointer" : ""} flex flex-col justify-between overflow-hidden shadow-2xl h-[525px]`}
    >
      {/* Background Decorative Sparkles with subtle glow spots */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 opacity-[0.05] rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/2 opacity-[0.03] rounded-full blur-xl pointer-events-none" />

      {/* Top Bar (Archetype, Status Indicator) */}
      <div className="flex justify-between items-center z-10" id={`card-top-${soul.id}`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10">
            {getArchetypeIcon(soul.archetype)}
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-90 text-white">
              {soul.archetype}
            </span>
          </div>
          {onViewHistory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(e);
              }}
              id={`btn-view-history-${soul.id}`}
              className="p-1.5 rounded-full bg-black/50 border border-white/15 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all cursor-pointer pointer-events-auto shadow-sm"
              title="Trace Archetype Chronicles & Trade History"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        {/* Owner Tag or Legendary Entity */}
        <div className="text-right">
          {!soul.isCustom ? (
            <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/25 text-amber-200 border border-amber-500/30 font-mono text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-sm shadow-amber-950/20">
              Legendary
            </span>
          ) : isSelfOwned ? (
            <span className="bg-gradient-to-r from-violet-500/35 to-fuchsia-500/20 text-violet-200 border border-violet-500/40 font-mono text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-sm shadow-violet-950/20">
              Your Vessel
            </span>
          ) : (
            <span className="bg-black/30 text-white/80 border border-white/10 font-mono text-[9px] px-2.5 py-1 rounded-full truncate max-w-[110px] inline-block font-semibold">
              {soul.owner}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic badges row under top bar */}
      <div className="flex flex-wrap gap-1.5 mt-2 z-10" id={`card-badges-row-${soul.id}`}>
        <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-extrabold border ${rarity.classes}`}>
          {rarity.name}
        </span>
        <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-extrabold border ${soulType.classes}`}>
          {soulType.name} Soul
        </span>
        {legacyBadge && (
          <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-extrabold border ${legacyBadge.classes}`}>
            {legacyBadge.name}
          </span>
        )}
      </div>

      {/* Main Body (Soul Name, Identity) */}
      <div className="my-3.5 z-10" id={`card-body-${soul.id}`}>
        <h3 className="font-serif text-[26px] font-bold tracking-tight leading-snug italic select-none text-white drop-shadow-md">
          {soul.name}
        </h3>
        
        {/* Poetic Alignment & Origin */}
        <div className="flex items-center gap-2 mt-2 opacity-80 text-[11px] font-mono text-zinc-300">
          <span className="font-bold">{soul.alignment}</span>
          <span className="opacity-40">•</span>
          <span className="truncate max-w-[150px] italic">originated by {soul.originalOwner}</span>
        </div>

        {/* Cryptic poetic description */}
        <p className="mt-4 text-xs leading-relaxed opacity-90 font-sans italic border-l-2 border-indigo-400 pl-3 text-zinc-200">
          "{soul.description}"
        </p>
      </div>

      {/* Trade Chronicles Summary Section */}
      <div className="mb-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/[0.04] text-[10px] font-mono z-10 flex flex-col gap-1 text-zinc-400">
        <div className="flex justify-between items-center text-[9px] text-zinc-500 tracking-wider">
          <span>CHRONICLES</span>
          <span className="text-violet-300 font-bold">🔄 {tradeCount} Swap{tradeCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-zinc-650 opacity-60">Trace:</span>
          <span className="text-[10px] text-zinc-200 truncate max-w-[215px]" title={uniquePrevOwners.join(" ➔ ")}>
            {traceSummary}
          </span>
        </div>
      </div>

      {/* Metrics Section (Purity, Power, Weight) */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3.5 z-10" id={`card-metrics-${soul.id}`}>
        
        {/* Spark Power indicator */}
        <div>
          <div className="flex justify-between text-[9px] font-mono tracking-wider opacity-80 mb-1.5 text-zinc-300">
            <span>SPARK POWER</span>
            <span className="font-extrabold text-white">{soul.power}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-violet-400 to-fuchsia-400 h-full opacity-90" 
              style={{ width: `${soul.power}%` }} 
            />
          </div>
        </div>

        {/* Dynamic lower numbers */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="border-r border-white/10">
            <div className="text-[9px] font-mono tracking-wider opacity-70 text-zinc-400 uppercase">SPIRIT PURITY</div>
            <div className="font-serif text-lg font-extrabold tracking-tight text-white mt-0.5">
              {soul.purity}<span className="text-xs font-mono opacity-50 font-normal">/100</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-wider opacity-70 text-zinc-400 uppercase">SOUL WEIGHT</div>
            <div className="font-serif text-lg font-extrabold tracking-tight text-white mt-0.5">
              {soul.weight}<span className="text-xs font-mono opacity-50 font-normal">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button Section */}
      {actionButtonLabel && onActionButtonClick && (
        <div className="mt-4 pt-1 z-10" id={`card-actions-${soul.id}`}>
          <button
            id={`btn-soul-act-${soul.id}`}
            disabled={disabledActions}
            onClick={(e) => {
              e.stopPropagation();
              onActionButtonClick(e);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-[10px] font-mono tracking-widest uppercase font-extrabold text-black bg-white hover:bg-neutral-100 active:translate-y-px transition-all duration-250 disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-black/10"
          >
            {actionButtonLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
}
