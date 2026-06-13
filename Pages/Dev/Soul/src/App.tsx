import React, { useState, useEffect, useRef } from "react";
import { Soul, TradeOffer, TradeLog } from "./types";
import { 
  Sparkles, 
  ArrowLeftRight, 
  History, 
  Globe, 
  RefreshCw, 
  User, 
  LogOut, 
  Plus, 
  Activity, 
  SlidersHorizontal, 
  Send,
  Check, 
  X, 
  Inbox,
  Sparkle,
  Info,
  Shield,
  Eye,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ManifestQuiz from "./components/ManifestQuiz";
import SoulCard from "./components/SoulCard";

export default function App() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "ledger" | "trades" | "history" | "bank">("inventory");
  
  // Ledger Databases
  const [souls, setSouls] = useState<Soul[]>([]);
  const [trades, setTrades] = useState<TradeOffer[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // Soul Bank States
  const [bankSouls, setBankSouls] = useState<Soul[]>([]);
  const [dealers, setDealers] = useState<string[]>([]);
  const [viewingSoulHistory, setViewingSoulHistory] = useState<Soul | null>(null);
  const [selectedDealerForClaim, setSelectedDealerForClaim] = useState<string>("Socrates");
  const [selectedNeedyPlayer, setSelectedNeedyPlayer] = useState<string>("");
  const [selectedBankSoulForGrant, setSelectedBankSoulForGrant] = useState<string>("");
  
  // Alchemical Exchange States
  const [exchangeOfferedSoulId, setExchangeOfferedSoulId] = useState<string>("");
  const [exchangeTargetSoulId, setExchangeTargetSoulId] = useState<string>("random");
  const [exchangeSelectedSacrifices, setExchangeSelectedSacrifices] = useState<string[]>([]);
  const [exchangeAgreedToRealWarning, setExchangeAgreedToRealWarning] = useState<boolean>(false);
  
  // UI Loading / Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Trading modal state
  const [proposingTrade, setProposingTrade] = useState<boolean>(false);
  const [targetSoul, setTargetSoul] = useState<Soul | null>(null);
  const [offeredSoulId, setOfferedSoulId] = useState<string>("");
  const [tradeReason, setTradeReason] = useState<string>("");

  // Burning and Admin Observatory stats
  const [burningSoul, setBurningSoul] = useState<Soul | null>(null);
  const [burnReason, setBurnReason] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [observatoryData, setObservatoryData] = useState<any>(null);

  // Ledger Filter states
  const [ledgerArchetypeFilter, setLedgerArchetypeFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("All");

  // Auth state gates
  const [authTab, setAuthTab] = useState<"login" | "register" | "quiz">("login");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Prevent duplicate mount logs / state tracks
  const nicknameFromStorage = localStorage.getItem("soul_nickname");

  // Load nickname from local storage on mount
  useEffect(() => {
    if (nicknameFromStorage) {
      setNickname(nicknameFromStorage);
      const normalized = nicknameFromStorage.trim().toLowerCase();
      if (normalized === "hsiman335@outlook" || normalized === "diccchops") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, []);

  // Update administrative privileges dynamically whenever nickname updates
  useEffect(() => {
    if (nickname) {
      const normalized = nickname.trim().toLowerCase();
      if (normalized === "hsiman335@outlook" || normalized === "diccchops") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [nickname]);

  // Fetch detailed Cosmic Admin logs & stats
  const fetchAdminObservatoryData = async () => {
    const currentNickname = localStorage.getItem("soul_nickname") || "";
    if (!currentNickname) return;
    try {
      const res = await fetch(`/api/admin/observatory?nickname=${encodeURIComponent(currentNickname)}`);
      if (res.ok) {
        const data = await res.json();
        setObservatoryData(data);
      }
    } catch (e) {
      console.error("Disrupted connection to Admin Observatory Channels:", e);
    }
  };

  // Fetch current database statistics
  const fetchLedgerData = async () => {
    try {
      const currentNickname = localStorage.getItem("soul_nickname") || "";
      const ledgerUrl = currentNickname ? `/api/ledger?nickname=${encodeURIComponent(currentNickname)}` : "/api/ledger";
      
      const [resLedger, resTrades, resLogs, resBank, resStats] = await Promise.all([
        fetch(ledgerUrl),
        fetch("/api/trades"),
        fetch("/api/logs"),
        fetch("/api/bank/status"),
        fetch("/api/dashboard/stats")
      ]);

      if (resLedger.ok && resTrades.ok && resLogs.ok && resBank.ok && resStats.ok) {
        const dataLedger = await resLedger.json();
        const dataTrades = await resTrades.json();
        const dataLogs = await resLogs.json();
        const dataBank = await resBank.json();
        const dataStats = await resStats.json();

        setSouls(dataLedger.souls || []);
        setTrades(dataTrades.trades || []);
        setLogs(dataLogs.logs || []);
        setBankSouls(dataBank.bankSouls || []);
        setDealers(dataBank.dealers || []);
        setDashboardStats(dataStats);

        // Synchronize admin dashboard if elevated
        const normalizedNick = currentNickname.trim().toLowerCase();
        if (isAdmin || normalizedNick === "hsiman335@outlook" || normalizedNick === "diccchops") {
          fetchAdminObservatoryData();
        }
      }
    } catch (err) {
      console.error("Spiritual connection disrupted during auto-sync:", err);
    }
  };

  // Run initial fetch on mount and setup polling based on current nickname
  const stringNickname = nickname || "";
  useEffect(() => {
    if (stringNickname) {
      fetchLedgerData();
      
      // Auto-poll ledger state every 4.5 seconds for true feeling of live trades!
      const timer = setInterval(() => {
        fetchLedgerData();
      }, 4500);

      return () => clearInterval(timer);
    }
  }, [stringNickname]);

  // Handle dynamic login or registration submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword) {
      setAuthError("Credentials cannot be left empty.");
      return;
    }

    setLoading(true);
    setAuthError(null);

    const endpoint = authTab === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: authUsername.trim(),
          password: authPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Aetheric connection denied.");
      }

      // Success!
      localStorage.setItem("soul_nickname", data.user.nickname);
      setNickname(data.user.nickname);
      setAuthError(null);
      setAuthUsername("");
      setAuthPassword("");
      
      // Trigger dynamic data reload
      await fetchLedgerData();
      setActiveTab("inventory");
    } catch (err: any) {
      setAuthError(err.message || "Failed to establish aura connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle successful quiz completion
  const handleManifestationSuccess = (newSoul: Soul, creatorNickname: string) => {
    localStorage.setItem("soul_nickname", creatorNickname);
    setNickname(creatorNickname);
    // Explicit sync immediately
    fetchLedgerData();
    setActiveTab("inventory");
  };

  // Log out or select new spirit avatar
  const handleExitMatrix = async () => {
    if (window.confirm("Disconnect from your current spiritual avatar? Your progress is saved and you can log back in with your password key anytime.")) {
      localStorage.removeItem("soul_nickname");
      setNickname(null);
      setSouls([]);
      setTrades([]);
      setLogs([]);
      setDashboardStats(null);
    }
  };

  // Reset Server to Initial seeds
  const handleFullReset = async () => {
    if (window.confirm("Trigger total cosmic convergence? This will reset all player-owned souls and trades to seed systems.")) {
      setLoading(true);
      try {
        const response = await fetch("/api/reset", { method: "POST" });
        if (response.ok) {
          const data = await response.json();
          setSuccessMsg(data.message);
          setTimeout(() => setSuccessMsg(null), 3500);
          fetchLedgerData();
        }
      } catch (err) {
        setErrorMsg("Failed to invoke celestial reset.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Propose a Trade from UI
  const handleProposeTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !targetSoul || !offeredSoulId) return;
    if (!tradeReason.trim()) {
      setErrorMsg("A reason for trade is mandatory.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/propose-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: nickname,
          senderSoulId: offeredSoulId,
          receiverName: targetSoul.owner,
          receiverSoulId: targetSoul.id,
          reason: tradeReason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Mystic transmission failed.");
      }

      if (data.status === "ACCEPTED") {
        setSuccessMsg(`Instant Trade Success! ${targetSoul.owner} says: "${data.responseMessage}"`);
        // Shift context to history or inventory
        setActiveTab("inventory");
      } else if (data.status === "DECLINED") {
        setErrorMsg(`Trade Refused. ${targetSoul.owner} says: "${data.responseMessage}"`);
      } else {
        setSuccessMsg("Trade proposal dispatched to owner ledger successfully.");
        setActiveTab("trades");
      }

      // Sync state and clean selection helpers
      fetchLedgerData();
      setProposingTrade(false);
      setTargetSoul(null);
      setOfferedSoulId("");
      setTradeReason("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize trade suggestion.");
    } finally {
      setLoading(false);
    }
  };

  // Submit burn request to permanently incinerate faux souls
  const handleBurnSoulSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !burningSoul || !burnReason.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soulId: burningSoul.id,
          nickname: nickname,
          reason: burnReason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Void furnace validation failed.");
      }

      setSuccessMsg(data.message);
      setBurningSoul(null);
      setBurnReason("");
      
      // Dynamic sync
      fetchLedgerData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit incinerator action.");
    } finally {
      setLoading(false);
    }
  };

  // Resolve pending trades (Accept or Decline)
  const handleResolveTradeOffer = async (tradeId: string, action: "ACCEPT" | "DECLINE") => {
    if (!nickname) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/resolve-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeId,
          action,
          resolverName: nickname
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Trade commitment failed.");
      }

      if (action === "ACCEPT") {
        setSuccessMsg("Celestial contract binds! Souls have rotated containers.");
      } else {
        setSuccessMsg("Trade proposal returned to the void.");
      }

      fetchLedgerData();
    } catch (err: any) {
      setErrorMsg(err.message || "Spiritual transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  // Helper lists computed dynamically
  const myOwnedSouls = souls.filter(s => s.owner === nickname);
  const otherEntitiesSouls = souls.filter(s => s.owner !== nickname);

  // Derived filtered lists for Aetheric Ledger
  const filteredLedgerSouls = otherEntitiesSouls.filter(soul => {
    const matchesArchetype = ledgerArchetypeFilter === "All" || soul.archetype === ledgerArchetypeFilter;
    const matchesSearch = searchQuery === "All" || 
      soul.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      soul.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      soul.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArchetype && matchesSearch;
  });

  // Filter dynamic trade lists
  const pendingIncomingTrades = trades.filter(t => t.receiverName === nickname && t.status === "PENDING");
  const pendingOutgoingTrades = trades.filter(t => t.senderName === nickname && t.status === "PENDING");
  const completedContractsHistory = trades.filter(t => (t.senderName === nickname || t.receiverName === nickname) && t.status !== "PENDING");

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-white antialiased relative overflow-hidden" id="psychic-manifest-game">
      
      {/* Decorative Atmospheric Nebulas */}
      <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full blur-[180px] aurora-bg-1 pointer-events-none z-0 opacity-70" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full blur-[180px] aurora-bg-2 pointer-events-none z-0 opacity-40" />

      {/* Main Container */}
      {!nickname ? (
        <div className="flex-1 flex flex-col justify-center items-center z-10 relative px-4 py-12">
          
          {/* Header element for brand */}
          <div className="text-center mt-4 mb-4 select-none">
            <h1 className="font-serif text-5xl md:text-6xl font-bold italic tracking-tight text-white flex items-center justify-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-indigo-300 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Soul Trader
              </span>
            </h1>
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-2">
              Aetheric soul manifestation & peer barter space
            </p>
          </div>

          {authTab === "quiz" ? (
            <div className="w-full max-w-xl">
              <div className="mb-4 text-center">
                <button
                  id="btn-back-to-auth"
                  onClick={() => setAuthTab("login")}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-mono text-[10px] uppercase tracking-wider text-zinc-300 cursor-pointer"
                >
                  ← Return to Cosmic Station
                </button>
              </div>
              <ManifestQuiz onManifestComplete={handleManifestationSuccess} />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="glass-card w-full max-w-md p-8 md:p-10 rounded-[32px] border border-white/10 shadow-3xl relative text-center"
              id="auth-gate-box"
            >
              {/* Ethereal Glow Indicator */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-violet-500/10 rounded-full border border-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                  <Sparkles className="w-7 h-7" />
                </div>
              </div>

              <h2 className="font-serif text-3.5xl italic font-bold tracking-tight text-white mb-2 leading-tight">
                {authTab === "login" ? "Cosmic Re-entry" : "Aetheric Manifestation"}
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-8 leading-relaxed font-sans">
                {authTab === "login" 
                  ? "Re-establish connection with your previous spiritual vessels." 
                  : "Manifest a persistent identity & receive your starting Original Soul."}
              </p>

              {authError && (
                <div className="bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl p-3.5 text-xs mb-5 text-left font-mono">
                  ⚠️ {authError}
                </div>
              )}

              {/* TABS */}
              <div className="flex bg-white/[0.02] p-1 border border-white/5 rounded-2xl mb-6">
                <button
                  id="btn-switch-login"
                  type="button"
                  onClick={() => { setAuthTab("login"); setAuthError(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    authTab === "login" ? "bg-white/10 text-white shadow-md" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="btn-switch-register"
                  type="button"
                  onClick={() => { setAuthTab("register"); setAuthError(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    authTab === "register" ? "bg-white/10 text-white shadow-md" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* AUTH FORM */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold ml-1">Spiritual Nickname</label>
                  <input
                    id="auth-username-input"
                    type="text"
                    required
                    placeholder="E.g., Wanderer7"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-xs font-mono tracking-wider focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold ml-1">Key Phrase (Password)</label>
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    placeholder="Enter access phrase..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-xs font-mono tracking-wider focus:outline-none transition-all"
                  />
                </div>

                <button
                  id="btn-submit-auth"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl font-mono text-xs font-extrabold tracking-widest uppercase shadow-xl hover:shadow-violet-950/40 active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {loading ? "Transmitting state..." : authTab === "login" ? "Open Connection" : "Forge Identity & Soul"}
                </button>
              </form>

              {/* Alternative Quiz Entry */}
              {authTab === "register" && (
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-3">Alternative Path</span>
                  <button
                    id="btn-go-quiz"
                    type="button"
                    onClick={() => setAuthTab("quiz")}
                    className="py-2.5 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/15 text-violet-300 hover:text-white transition-all text-2xs font-mono uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                    Take Interactive Soul Quiz
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <React.Fragment>
          {/* TOP DECK HEADER BAR */}
          <header className="z-40 border-b border-white/5 bg-[#050508]/65 backdrop-blur-xl sticky top-0 px-4 md:px-8 py-4.5 flex flex-col sm:flex-row justify-between items-center gap-4" id="top-psychic-header">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 rounded-2xl text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <ArrowLeftRight className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="font-serif italic font-extrabold text-2xl tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                  Soul Trader
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-zinc-505 uppercase block">
                  Connected to Cosmic Ledger
                </p>
              </div>
            </div>

            {/* User credentials / Core actions */}
            <div className="flex items-center gap-3">
              
              <div className="flex items-center gap-2 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/10 shadow-inner">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-mono text-xs font-extrabold text-zinc-200 uppercase tracking-widest truncate max-w-[120px]">
                  {nickname}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Dynamic Admin Elevation Toggle for direct testing */}
              {nickname && (nickname.trim().toLowerCase() === "hsiman335@outlook" || nickname.trim().toLowerCase() === "diccchops") && (
                <button
                  id="admin-elevation-toggle"
                  onClick={() => {
                    setIsAdmin(!isAdmin);
                    setSuccessMsg(isAdmin ? "Returned to normal traveler perspective." : "Elevated to admin status: Aetheric Registry Unlocked.");
                    setTimeout(() => setSuccessMsg(null), 3500);
                  }}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-all duration-150 font-extrabold cursor-pointer ${
                    isAdmin 
                      ? "bg-violet-950/50 text-violet-300 border-violet-500/40 hover:bg-violet-900/50" 
                      : "bg-white/[0.02] text-zinc-500 border-white/5 hover:text-zinc-350 hover:bg-white/[0.04]"
                  }`}
                  title="Elevate status to admin to see observatory channels"
                >
                  {isAdmin ? "🔒 Lock Admin" : "🔓 Unlock Admin"}
                </button>
              )}

              {/* Reset seed database action (very useful for sandbox play) */}
              <button
                id="btn-global-reset"
                onClick={handleFullReset}
                title="Reset Spiritual Database state"
                className="p-2 bg-white/[0.02] hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:border-red-500/30"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Log out action */}
              <button
                id="btn-exit-game"
                onClick={handleExitMatrix}
                title="Disconnect your current form"
                className="p-2.5 bg-[#0e0e13]/60 hover:bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-mono font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exit</span>
              </button>
            </div>
          </header>

          {/* MAIN ROOM CONTENT */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 z-10 space-y-6" id="main-ledger-stage">
            
            {/* Status alerts */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-950/40 text-red-300 border border-red-900/50 rounded-xl p-4 text-xs font-mono flex items-start gap-3"
                  id="error-banner-space"
                >
                  <Info className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold">PSYCHIC FAULT:</span> {errorMsg}
                  </div>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-950/40 text-emerald-300 border border-emerald-900/50 rounded-xl p-4 text-xs font-mono flex items-start gap-3 shadow-lg shadow-emerald-950/20"
                  id="success-banner-space"
                >
                  <Check className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold">ECLIPTIC ALIGNMENT:</span> {successMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB SELECTOR STRAP */}
            <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 justify-between items-center sm:w-fit backdrop-blur-md gap-1.5" id="tab-nav-bar">
              <button
                id="btn-tab-inventory"
                onClick={() => { setActiveTab("inventory"); setSuccessMsg(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-white/5 text-white shadow-lg border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Sparkle className="w-4 h-4 text-violet-400" />
                Vessels ({myOwnedSouls.length})
              </button>

              <button
                id="btn-tab-ledger"
                onClick={() => { setActiveTab("ledger"); setSuccessMsg(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "ledger"
                    ? "bg-white/5 text-white shadow-lg border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Globe className="w-4 h-4 text-violet-400" />
                Ledger ({filteredLedgerSouls.length})
              </button>

              <button
                id="btn-tab-trades"
                onClick={() => { setActiveTab("trades"); setSuccessMsg(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer relative ${
                  activeTab === "trades"
                    ? "bg-white/5 text-white shadow-lg border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-violet-400" />
                Seals & Swaps
                {pendingIncomingTrades.length > 0 && (
                  <span className="absolute top-[-2px] right-[-2px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-bounce shadow-md">
                    {pendingIncomingTrades.length}
                  </span>
                )}
              </button>

              <button
                id="btn-tab-history"
                onClick={() => { setActiveTab("history"); setSuccessMsg(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "history"
                    ? "bg-white/5 text-white shadow-lg border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <History className="w-4 h-4 text-violet-400" />
                Chronicles ({logs.length})
              </button>

              <button
                id="btn-tab-bank"
                onClick={() => { setActiveTab("bank"); setSuccessMsg(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === "bank"
                    ? "bg-white/5 text-white shadow-lg border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4 text-violet-400" />
                Soul Bank ({bankSouls.length})
              </button>

              {isAdmin && (
                <button
                  id="btn-tab-admin-observatory"
                  onClick={() => { setActiveTab("admin-observatory"); setSuccessMsg(null); fetchAdminObservatoryData(); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === "admin-observatory"
                      ? "bg-violet-600/15 text-violet-300 shadow-lg border-b-2 border-violet-500 animate-pulse"
                      : "text-purple-400/80 hover:text-purple-300"
                  }`}
                >
                  <Eye className="w-4 h-4 text-violet-400" />
                  Observatory
                </button>
              )}
            </div>

            {/* TAB CONTENT ZONE */}
            <div className="z-10 relative">
              <AnimatePresence mode="wait">
                
                {/* 1. MY SOUL CLOSET / VESSEL COLLECTION */}
                {activeTab === "inventory" && (
                  <motion.div
                    key="tab-inventory-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-2">
                      <div>
                        <h2 className="font-serif text-3xl font-normal tracking-tight text-white flex items-center gap-2.5 italic">
                          Your Active Vessel Collection
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1 pb-1">
                          These are the distinct souls currently bounded to your physical account. You can trade any of these with legendary entities or fellow travelers.
                        </p>
                      </div>
                      
                      <div className="text-zinc-400 font-mono text-[10px] uppercase border border-white/10 bg-white/[0.02] px-4 py-2 rounded-2xl shadow-sm">
                        Total Spiritual Weight: <span className="font-bold text-white tracking-widest">{myOwnedSouls.reduce((acc, soul) => acc + soul.weight, 0)}g</span>
                      </div>
                    </div>

                    {/* Game Design / Soul Rules Panel */}
                    <div className="bg-gradient-to-br from-indigo-950/20 via-black/40 to-stone-950/40 border border-white/5 p-5 rounded-2xl space-y-3.5 mb-6" id="soul-doctrines-panel">
                      <div className="flex items-center gap-2">
                        <Info className="w-4.5 h-4.5 text-violet-400" />
                        <h3 className="font-serif text-lg italic text-zinc-100">Soul Ownership Doctrines</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans text-zinc-400 leading-relaxed">
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1">
                          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block">1. Original Soul</span>
                          <p className="text-[11px]">Every traveler receives exactly one unique Original Soul tied securely to their creator identity. You can never create a second Original Soul.</p>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1">
                          <span className="text-fuchsia-400 font-mono text-[10px] font-bold uppercase tracking-wider block">2. Inherited Soul</span>
                          <p className="text-[11px]">Any Original Soul created by another player and acquired by you through an official exchange ledger is classified as Inherited.</p>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1">
                          <span className="text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider block">3. Faux Soul</span>
                          <p className="text-[11px]">Artificial replicated souls produced by the chemical forge. You can synthesize a Faux replica of any soul in your possession.</p>
                        </div>
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1">
                          <span className="text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider block">4. New Soul</span>
                          <p className="text-[11px]">A newly generated soul from the primordial Soul Bank reserves. If you lose your Original Soul, start anew with these bank sparks.</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-white/5">
                        💡 <span className="text-zinc-400 font-semibold">Doctrine of Loss:</span> If you trade your starting Original Soul, you permanently lose ownership of it unless that exact unique soul is traded back to your active vessel collection.
                      </div>
                    </div>

                    {myOwnedSouls.length === 0 ? (
                      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-400 max-w-md mx-auto" id="no-inventory-splash">
                        <Inbox className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                        <h3 className="font-display text-lg font-bold text-zinc-300">Your Vessel is Empty</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-2 leading-relaxed">
                          You currently carry no souls. This is a rare state of complete detachment! Tap below to manifest a starting spark or reset parameters.
                        </p>
                        <button
                          id="btn-re-manifest"
                          onClick={() => {
                            localStorage.removeItem("soul_nickname");
                            setNickname(null);
                          }}
                          className="mt-6 font-mono text-2xs uppercase tracking-widest font-bold bg-zinc-900 hover:bg-zinc-850 px-4 py-2 border border-zinc-800 rounded-lg text-white"
                        >
                          Manifest Starting Spark
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="inventory-grid">
                        {myOwnedSouls.map(soul => (
                          <div key={soul.id} className="relative group flex flex-col justify-between">
                            <SoulCard
                              soul={soul}
                              hoverable={true}
                              currentUserNickname={nickname}
                              actionButtonLabel="Dispatch swap trade..."
                              onViewHistory={() => setViewingSoulHistory(soul)}
                              onActionButtonClick={() => {
                                setTargetSoul(null);
                                setOfferedSoulId(soul.id);
                                setActiveTab("ledger");
                                setSuccessMsg(`Select an external soul in the Ledger tab to exchange for your "${soul.name}".`);
                              }}
                            />
                            
                            <div className="mt-3 flex justify-between gap-2.5 px-1" id={`replicate-action-${soul.id}`}>
                              {soul.isFaux || soul.soulType === "Faux" ? (
                                <button
                                  id={`btn-burn-faux-${soul.id}`}
                                  onClick={() => {
                                    setBurningSoul(soul);
                                    setBurnReason("");
                                  }}
                                  className="w-full py-2.5 px-3 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-550/15 font-mono text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center"
                                  title="Permanently burn and destroy this artificial duplicate soul card"
                                >
                                  🔥 Incinerate Faux Vessel
                                </button>
                              ) : (
                                <button
                                  id={`btn-replicate-${soul.id}`}
                                  onClick={async () => {
                                    if (!nickname) return;
                                    setLoading(true);
                                    setErrorMsg(null);
                                    try {
                                      const res = await fetch("/api/replicate", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ soulId: soul.id, nickname })
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        setSuccessMsg(data.message || "Faux clone successfully forged!");
                                        fetchLedgerData();
                                      } else {
                                        setErrorMsg(data.error || "Cloning disrupted.");
                                      }
                                    } catch (err) {
                                      setErrorMsg("Fabricator connection lost.");
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  disabled={loading}
                                  className="w-full py-2.5 px-3 rounded-xl border border-rose-500/10 hover:border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 font-mono text-[10px] text-rose-300 font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center disabled:opacity-40"
                                  title="Forge an artificial, replicated copy of this soul"
                                >
                                  🧪 Synthesize Faux Copy
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. THE LOBBY & LEDGER (MARKETPLACE) */}
                {activeTab === "ledger" && (
                  <motion.div
                    key="tab-ledger-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    
                    {/* Dynamic Cosmic Census & Leaderboards Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-white/5 pb-8" id="cosmic-dashboard-panel">
                      
                      {/* STATS COUNT GRID (Fits 4 cols on lg) */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                        <div className="border border-white/10 bg-white/[0.01] p-6 rounded-3xl space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
                          {/* Ambient backdrop */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
                          
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-extrabold flex items-center gap-1.5 mb-1 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                              Astral Ledger Status
                            </span>
                            <h3 className="font-serif text-2xl italic text-white tracking-tight">Cosmic Soul Census</h3>
                          </div>

                          {/* Stat items */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                            
                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">Total Active</span>
                              <span className="font-mono text-2.5xl font-extrabold text-white mt-1 pr-1">{dashboardStats?.totalActive ?? 0}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">Originals</span>
                              <span className="font-mono text-2.5xl font-extrabold text-emerald-400 mt-1 pr-1">{dashboardStats?.originalCount ?? 0}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">Inherited</span>
                              <span className="font-mono text-2.5xl font-extrabold text-violet-400 mt-1 pr-1">{dashboardStats?.inheritedCount ?? 0}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">New Souls</span>
                              <span className="font-mono text-2.5xl font-extrabold text-sky-400 mt-1 pr-1">{dashboardStats?.newCount ?? 0}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">Faux Copies</span>
                              <span className="font-mono text-2.5xl font-extrabold text-rose-400 mt-1 pr-1">{dashboardStats?.fauxCount ?? 0}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-between relative group">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none flex items-center gap-1">
                                Online Users
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              </span>
                              <span className="font-mono text-2.5xl font-extrabold text-white mt-1 pr-1">{dashboardStats?.onlineCount ?? 0}</span>
                              
                              {/* Hover active players list */}
                              {dashboardStats?.onlineList && dashboardStats.onlineList.length > 0 && (
                                <div className="absolute bottom-full mb-1 left-0 bg-[#07070a] border border-white/10 rounded-xl p-2.5 text-[10px] font-mono text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[180px] z-20 shadow-xl leading-relaxed">
                                  <span className="text-zinc-500 block uppercase mb-1 font-bold">Intertwined:</span>
                                  {dashboardStats.onlineList.join(", ")}
                                </div>
                              )}
                            </div>

                          </div>
                          
                          <p className="text-[10px] font-mono text-zinc-500 leading-normal border-t border-white/5 pt-3">
                            The space-time continuum actively verifies active bindings and rejects unauthorized duplicate originals.
                          </p>
                        </div>
                      </div>

                      {/* LEADERBOARDS SECTION (Fits 7 cols on lg with 3 Leaderboards side by side) */}
                      <div className="lg:col-span-7 border border-white/10 bg-white/[0.01] p-6 rounded-3xl space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
                        {/* Ambient backdrop */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-extrabold block mb-1">hall of record keepers</span>
                          <h3 className="font-serif text-2xl italic text-white tracking-tight">Ecosystem Leaderboards</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 flex-1">
                          
                          {/* Column 1: Most Powerful */}
                          <div className="space-y-3 bg-white/[0.01] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                            <div>
                              <h4 className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-extrabold flex items-center gap-1.5 pb-1 border-b border-white/5">
                                ⚡ Powerful
                              </h4>
                              <div className="space-y-2 mt-2">
                                {dashboardStats?.mostPowerful?.map((soul: any, idx: number) => (
                                  <div key={soul.id} className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-zinc-400 truncate max-w-[80px]" title={soul.name}>
                                      {idx + 1}. {soul.name}
                                    </span>
                                    <span className="text-amber-400 font-bold">{soul.power}%</span>
                                  </div>
                                )) || <div className="text-[10px] font-mono text-zinc-650">Syncing...</div>}
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Rarest */}
                          <div className="space-y-3 bg-white/[0.01] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                            <div>
                              <h4 className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-extrabold flex items-center gap-1.5 pb-1 border-b border-white/5">
                                💎 Rarest
                              </h4>
                              <div className="space-y-2 mt-2">
                                {dashboardStats?.rarest?.map((soul: any, idx: number) => {
                                  let label = "Common";
                                  let col = "text-zinc-400";
                                  if (soul.power >= 95) { label = "Mythic"; col = "text-fuchsia-400"; }
                                  else if (soul.power >= 85) { label = "Epic"; col = "text-amber-400"; }
                                  else if (soul.power >= 65) { label = "Rare"; col = "text-indigo-400"; }
                                  
                                  return (
                                    <div key={soul.id} className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-zinc-400 truncate max-w-[80px]" title={soul.name}>
                                        {idx + 1}. {soul.name}
                                      </span>
                                      <span className={`font-bold ${col}`}>{label}</span>
                                    </div>
                                  );
                                }) || <div className="text-[10px] font-mono text-zinc-650">Syncing...</div>}
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Most Traded */}
                          <div className="space-y-3 bg-white/[0.01] border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between">
                            <div>
                              <h4 className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-extrabold flex items-center gap-1.5 pb-1 border-b border-white/5">
                                🔄 Traded
                              </h4>
                              <div className="space-y-2 mt-2">
                                {dashboardStats?.mostTraded?.map((soul: any, idx: number) => {
                                  const tr = soul.history ? soul.history.filter((h: any) => h.action === "TRADED").length : 0;
                                  return (
                                    <div key={soul.id} className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-zinc-400 truncate max-w-[80px]" title={soul.name}>
                                        {idx + 1}. {soul.name}
                                      </span>
                                      <span className="text-violet-400 font-extrabold">{tr} Swaps</span>
                                    </div>
                                  );
                                }) || <div className="text-[10px] font-mono text-zinc-650">Syncing...</div>}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                    
                    {/* Header Controls (Filters/Searches) */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-4 animate-fadeIn">
                      <div>
                        {offeredSoulId ? (
                          <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-300 border border-violet-800/20 font-mono text-[10px] px-4 py-3 rounded-2xl uppercase tracking-wider font-extrabold mb-4 flex items-center justify-between gap-4 max-w-xl shadow-lg">
                            <span className="truncate">
                              OFFERING SOURCE: <span className="text-white">"{myOwnedSouls.find(s => s.id === offeredSoulId)?.name}"</span>
                            </span>
                            <button
                              id="btn-cancel-trade-selection"
                              onClick={() => setOfferedSoulId("")}
                              className="text-zinc-400 hover:text-white font-mono text-[10px] underline uppercase flex items-center gap-1 flex-shrink-0 cursor-pointer"
                            >
                              Cancel Target
                            </button>
                          </div>
                        ) : null}
                        <h2 className="font-serif text-3xl font-normal tracking-tight text-white flex items-center gap-2.5 italic">
                          The Aetheric Soul Ledger
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                          Observe and barter with souls generated by other active players or bounded within legendary historical figures.
                        </p>
                      </div>

                      {/* Filter Widgets */}
                      <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto" id="filter-shelf">
                        
                        {/* Search bar */}
                        <div className="relative flex-1 md:flex-initial">
                          <input
                            type="text"
                            placeholder="Search elements/owners..."
                            value={searchQuery === "All" ? "" : searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.trim() ? e.target.value : "All")}
                            className="bg-black/50 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 min-w-[210px] font-mono focus:outline-none transition-all"
                          />
                        </div>

                        {/* Archetype Selector */}
                        <div className="flex bg-white/[0.01] p-1 border border-white/10 rounded-xl text-xs font-mono backdrop-blur-3xl gap-1">
                          {["All", "Celestial", "Abyssal", "Stardust", "Void"].map((arc) => (
                            <button
                              key={arc}
                              id={`filter-arc-${arc}`}
                              onClick={() => setLedgerArchetypeFilter(arc)}
                              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                ledgerArchetypeFilter === arc
                                  ? "bg-white/10 text-white font-bold"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {arc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {filteredLedgerSouls.length === 0 ? (
                      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-400 max-w-sm mx-auto" id="no-ledger-match">
                        <Info className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <h3 className="font-display text-base font-bold text-zinc-400">No souls align</h3>
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                          No cosmic souls match your filters. Try selecting a different archetype filter.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="ledger-grid">
                        {filteredLedgerSouls.map((soul) => {
                          
                          // Determine action button properties
                          let label = "Initiate Swapping Contract";
                          let buttonDisabled = false;

                          if (offeredSoulId) {
                            label = "Deliver Trade Proposal";
                          } else if (myOwnedSouls.length === 0) {
                            label = "Vessel Empty (Trade Locked)";
                            buttonDisabled = true;
                          }

                          return (
                            <div key={soul.id} className="relative">
                               <SoulCard
                                soul={soul}
                                currentUserNickname={nickname}
                                disabledActions={buttonDisabled}
                                actionButtonLabel={label}
                                onViewHistory={() => setViewingSoulHistory(soul)}
                                onActionButtonClick={() => {
                                  setTargetSoul(soul);
                                  if (offeredSoulId) {
                                    // Instantly open proposal dial or just execute!
                                    setProposingTrade(true);
                                  } else {
                                    // Open model/selection prompt to select which owned soul to offer!
                                    if (myOwnedSouls.length === 1) {
                                      setOfferedSoulId(myOwnedSouls[0].id);
                                      setProposingTrade(true);
                                    } else {
                                      setProposingTrade(true);
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. ACTIVE SEALS AND TRADES (INBOX / OUTBOX) */}
                {activeTab === "trades" && (
                  <motion.div
                    key="tab-trades-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    
                    {/* INCOMING RECEIVED PROPOSALS (INBOX) */}
                    <div className="lg:col-span-6 space-y-4" id="incoming-trades-inbox">
                      <h3 className="font-serif italic text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-white/5">
                        <Inbox className="w-4 h-4 text-emerald-400" />
                        Received Offers ({pendingIncomingTrades.length})
                      </h3>

                      {pendingIncomingTrades.length === 0 ? (
                        <div className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs" id="no-incoming-notice">
                          No pending offers received yet. Other mortal players can propose swaps if they want souls in your possession.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingIncomingTrades.map((t) => (
                            <div key={t.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="bg-violet-500/10 text-violet-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    MORTAL SWAP CONTRACT
                                  </span>
                                  <h4 className="font-display text-sm font-semibold text-zinc-200 mt-1 leading-snug">
                                    <span className="text-zinc-400 font-mono font-normal">Sender:</span> {t.senderName}
                                  </h4>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-600">
                                  {new Date(t.createdAt).toLocaleTimeString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-11 items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/5 text-center text-xs">
                                <div className="col-span-5 bg-zinc-900/65 rounded p-2.5">
                                  <div className="text-[9px] font-mono tracking-wider opacity-50 uppercase mb-0.5">HE OFFERS</div>
                                  <div className="font-semibold text-zinc-100 truncate">{t.senderSoulName}</div>
                                </div>
                                <div className="col-span-1 text-zinc-600 flex justify-center">
                                  <ArrowLeftRight className="w-4 h-4" />
                                </div>
                                <div className="col-span-5 bg-zinc-900/65 rounded p-2.5">
                                  <div className="text-[9px] font-mono tracking-wider opacity-50 uppercase mb-0.5">YOU LOSE</div>
                                  <div className="font-semibold text-zinc-100 truncate">{t.receiverSoulName}</div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  id={`btn-accept-trade-${t.id}`}
                                  onClick={() => handleResolveTradeOffer(t.id, "ACCEPT")}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-2xs font-bold uppercase rounded-lg flex items-center justify-center gap-1 active:translate-y-px transition-all"
                                >
                                  <Check className="w-3 h-3" /> Bind Swap
                                </button>
                                <button
                                  id={`btn-reject-trade-${t.id}`}
                                  onClick={() => handleResolveTradeOffer(t.id, "DECLINE")}
                                  className="py-1.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-2xs uppercase rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <X className="w-3 h-3" /> Refuse
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SENT ACTIVE DEMANDS (OUTBOX) */}
                    <div className="lg:col-span-6 space-y-4" id="sent-trades-outbox">
                      <h3 className="font-display text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Send className="w-3.5 h-3.5 text-violet-400" />
                        Dispatched Proposals ({pendingOutgoingTrades.length})
                      </h3>

                      {pendingOutgoingTrades.length === 0 ? (
                        <div className="bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs" id="no-outgoing-notice">
                          No pending proposed swaps found. Choose a soul you own in 'Inventory' and trade in 'Ledger' to dispatch barter ideas.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingOutgoingTrades.map((t) => (
                            <div key={t.id} className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-5 space-y-4 relative overflow-hidden">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="bg-zinc-800/80 text-zinc-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    PENDING COLLECTIVE SWAP
                                  </span>
                                  <h4 className="font-display text-sm font-semibold text-zinc-200 mt-1 leading-snug">
                                    <span className="text-zinc-500 font-mono font-normal">Receiver:</span> {t.receiverName}
                                  </h4>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-600">
                                  {new Date(t.createdAt).toLocaleTimeString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-11 items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/5 text-center text-xs">
                                <div className="col-span-5 bg-zinc-900/40 rounded p-2.5 text-zinc-400">
                                  <div className="text-[9px] font-mono tracking-wider opacity-50 uppercase mb-0.5">YOU GIVING</div>
                                  <div className="font-semibold truncate">{t.senderSoulName}</div>
                                </div>
                                <div className="col-span-1 text-zinc-700 flex justify-center">
                                  <ArrowLeftRight className="w-4 h-4" />
                                </div>
                                <div className="col-span-5 bg-zinc-900/40 rounded p-2.5 text-zinc-400">
                                  <div className="text-[9px] font-mono tracking-wider opacity-50 uppercase mb-0.5">YOU SEEK</div>
                                  <div className="font-semibold truncate">{t.receiverSoulName}</div>
                                </div>
                              </div>

                              <div className="text-[10px] font-mono text-zinc-500 italic">
                                Waiting for target to sign alignment protocols...
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* REJECTED/CLOSED ALIGNMENTS (ARCHIVES) */}
                    <div className="lg:col-span-12 space-y-4 pt-4" id="trade-history-ledger-shelf">
                      <h3 className="font-display text-md font-bold text-zinc-400 flex items-center gap-2 border-b border-zinc-900 pb-2">
                        Your Void Transactions ({completedContractsHistory.length})
                      </h3>

                      {completedContractsHistory.length === 0 ? (
                        <div className="text-zinc-600 font-mono text-xs">No records archived under your present pseudonym.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {completedContractsHistory.map((t) => (
                            <div key={t.id} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl text-xs space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded ${
                                  t.status === "ACCEPTED" 
                                    ? "bg-emerald-500/10 text-emerald-400" 
                                    : "bg-red-500/10 text-red-400"
                                }`}>
                                  {t.status}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-700">
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <p className="font-sans text-zinc-300">
                                {t.senderName} offered <span className="text-white font-medium">"{t.senderSoulName}"</span> in exchange for <span className="text-white font-medium">"{t.receiverSoulName}"</span> owned by {t.receiverName}.
                              </p>

                              {t.responseMessage && (
                                <div className="bg-black/30 p-2.5 rounded border border-white/5 font-mono text-[11px] text-zinc-400">
                                  <span className="text-zinc-500 font-bold uppercase text-[9px] block mb-1">NPC FEEDBACK:</span>
                                  "{t.responseMessage}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}

                {/* 4. CHRONICLES (COMPLETED SEALS LOGS OF ALL TRANSACTIONS) */}
                {activeTab === "history" && (
                  <motion.div
                    key="tab-history-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-zinc-900/60 pb-3">
                      <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        Ancient Chronicles Ledger
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        A systemic history of all soul contracts written across this server instance.
                      </p>
                    </div>

                    {logs.length === 0 ? (
                      <div className="text-center py-12 text-zinc-600 font-mono text-xs">The chronicles are clean and silent. No exchanges committed yet.</div>
                    ) : (
                      <div className="divide-y divide-zinc-900 bg-zinc-950/20 rounded-xl border border-zinc-900 overflow-hidden" id="chronicles-list">
                        {logs.map((log) => (
                          <div key={log.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-950/40 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-violet-600/10 text-violet-400 border border-violet-800/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <ArrowLeftRight className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-sans text-sm text-zinc-100">
                                  <span className="font-mono font-semibold text-indigo-400 uppercase tracking-wider">{log.senderName}</span>
                                  <span className="text-zinc-500 font-light mx-2">traded</span>
                                  <span className="text-white italic">"{log.offeredSoulName}"</span>
                                  <span className="text-zinc-500 font-light mx-2">to</span>
                                  <span className="font-mono font-semibold text-indigo-400 uppercase tracking-wider">{log.receiverName}</span>
                                  <span className="text-zinc-500 font-light mx-2">for</span>
                                  <span className="text-white italic">"{log.receivedSoulName}"</span>
                                </p>
                                <span className="font-mono text-[10px] text-zinc-600 block mt-1">
                                  Transaction Hash ID: {log.id}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="font-mono text-xs text-zinc-500">
                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. SOUL BANK & DEALERS BOARD */}
                {activeTab === "bank" && (
                  <motion.div
                    key="tab-bank-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
                      <div>
                        <h2 className="font-serif text-3xl font-normal tracking-tight text-white flex items-center gap-2.5 italic">
                          The Divine Soul Bank
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1 pb-1">
                          A collective sanctuary of ancient, uncommitted souls. De-vesselized travelers can petition an authorized Soul Dealer to receive a fresh beginning.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          id="btn-toggle-dealer-status"
                          onClick={async () => {
                            if (!nickname) return;
                            setLoading(true);
                            try {
                              const res = await fetch("/api/bank/toggle-dealer", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ nickname })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setDealers(data.dealers);
                                setSuccessMsg(data.message);
                                setTimeout(() => setSuccessMsg(null), 3500);
                              }
                            } catch (e) {
                              setErrorMsg("Failed to toggle dealer status.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wide border transition-all duration-200 cursor-pointer ${
                            dealers.includes(nickname || "")
                              ? "bg-purple-950/40 text-purple-300 border-purple-500/35 shadow-lg"
                              : "bg-white/[0.02] text-zinc-400 border-white/10 hover:bg-white/5"
                          }`}
                        >
                          {dealers.includes(nickname || "") ? "★ Registered Dealer" : "Register as Dealer"}
                        </button>

                        <button
                          id="btn-restock-celestial-source"
                          onClick={async () => {
                            setLoading(true);
                            setErrorMsg(null);
                            try {
                              const res = await fetch("/api/bank/restock", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ dealerName: nickname })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setSuccessMsg(`Celestial Forge generated: "${data.soul.name}" into the bank.`);
                                setTimeout(() => setSuccessMsg(null), 3500);
                                fetchLedgerData();
                              } else {
                                const errData = await res.json();
                                setErrorMsg(errData.error || "Restock failed.");
                              }
                            } catch (err) {
                              setErrorMsg("Network error restocking bank.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-white text-black hover:bg-neutral-200 hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-white/10"
                        >
                          <Plus className="w-3.5 h-3.5" /> Invoke Restock
                        </button>
                      </div>
                    </div>

                    {/* Status overview list cards */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Left: Interactive panel (Claim / Grant) */}
                      <div className="md:col-span-4 space-y-6">
                        
                        {/* 1. SEEL DEALERS LIST */}
                        <div className="bg-[#0e0e13]/60 rounded-2xl border border-white/5 p-5 space-y-4">
                          <h3 className="font-serif italic text-lg text-zinc-100 flex items-center gap-2">
                            <User className="w-4.5 h-4.5 text-violet-400" />
                            Active Soul Dealers
                          </h3>
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                            These entities have authorities to grant replacement souls from the vaults to any traveler with 0 empty spiritual vessels.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1" id="dealers-list">
                            {dealers.map((dlr) => (
                              <span
                                key={dlr}
                                className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider border ${
                                  ["Socrates", "The Lost Dev"].includes(dlr)
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                    : dlr === nickname
                                    ? "bg-violet-500/15 text-violet-200 border-violet-500/30"
                                    : "bg-black/40 text-zinc-400 border-white/5"
                                }`}
                              >
                                {["Socrates", "The Lost Dev"].includes(dlr) ? `NPC • ${dlr}` : dlr}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 2. PLAYER CLAIM CORNER (if player has 0 souls, let them claim immediately) */}
                        {myOwnedSouls.length === 0 ? (
                          <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/10 border border-violet-900/30 rounded-2xl p-6 space-y-4 shadow-xl">
                            <span className="bg-violet-500/10 text-violet-200 font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                              Spiritual Welfare Bureau
                            </span>
                            <h3 className="font-serif text-xl italic text-white leading-normal">
                              Request a Fresh Essence
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              Your spiritual container currently holds <span className="font-bold text-white uppercase font-mono bg-black/40 px-1.5 py-0.5 rounded">0 active souls</span>. You are entitled to a fresh, custom manifestation from the Soul Bank!
                            </p>

                            <div className="space-y-3.5 pt-2" id="claim-intervention-panel">
                              {/* Select Soul from Bank to request */}
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                                  1. Target Bank Soul
                                </label>
                                {bankSouls.length === 0 ? (
                                  <div className="text-[10px] font-mono text-red-400 border border-red-950 bg-red-950/20 p-2.5 rounded-lg">
                                    Bank is currently empty. Click "Invoke Restock" to generate souls!
                                  </div>
                                ) : (
                                  <select
                                    id="claim-soul-select"
                                    value={selectedBankSoulForGrant}
                                    onChange={(e) => setSelectedBankSoulForGrant(e.target.value)}
                                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none"
                                  >
                                    <option value="">-- Choose Fresh Essence --</option>
                                    {bankSouls.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.archetype} - Power {s.power}%)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Select Dealer */}
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                                  2. Select Soul Dealer to Petition
                                </label>
                                <select
                                  id="claim-dealer-select"
                                  value={selectedDealerForClaim}
                                  onChange={(e) => setSelectedDealerForClaim(e.target.value)}
                                  className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none"
                                >
                                  {dealers.map((d) => (
                                    <option key={d} value={d}>
                                      {d} {["Socrates", "The Lost Dev"].includes(d) ? "(NPC - INSTANT APPROVAL)" : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                id="btn-submit-petition-claim"
                                disabled={!selectedBankSoulForGrant || !selectedDealerForClaim || loading}
                                onClick={async () => {
                                  if (!selectedBankSoulForGrant || !selectedDealerForClaim) return;
                                  setLoading(true);
                                  setErrorMsg(null);
                                  setSuccessMsg(null);
                                  try {
                                    const res = await fetch("/api/bank/claim", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        nickname,
                                        dealerName: selectedDealerForClaim,
                                        soulId: selectedBankSoulForGrant
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setSuccessMsg(`Petition approved by ${selectedDealerForClaim}! Voice: "${data.comment}"`);
                                      setSelectedBankSoulForGrant("");
                                      fetchLedgerData();
                                      setActiveTab("inventory");
                                    } else {
                                      setErrorMsg(data.error || "Failed to finalize petition swap.");
                                    }
                                  } catch (err) {
                                    setErrorMsg("Could not formulate soul request transaction.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="w-full mt-2 py-3 px-4 rounded-xl text-2xs font-mono tracking-widest uppercase font-extrabold text-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 hover:opacity-95 text-center active:translate-y-px transition-all duration-200 shadow-md cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              >
                                {loading ? "Invoking Dealer..." : "Petition Dealer & Grant Soul"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#0e0e13]/30 border border-white/5 rounded-2xl p-5 space-y-2 text-center">
                            <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                            <h4 className="font-display text-sm font-semibold text-zinc-300">Spiritual Core Bounded</h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans max-w-xs mx-auto">
                              Your active vessel collection already contains {myOwnedSouls.length} soul(s). Welfare replenishment is restricted to vessel-less spirits who have successfully traded away all their assets!
                            </p>
                          </div>
                        )}

                        {/* 3. AUTHORIZED DEALER TOOLBOX (Shown only to registered dealers) */}
                        {dealers.includes(nickname || "") && (
                          <div className="bg-gradient-to-br from-violet-950/20 to-stone-950/40 border border-violet-500/20 rounded-2xl p-6 space-y-4 shadow-xl">
                            <span className="bg-amber-500/10 text-amber-300 font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                              Authorized Dealers Only
                            </span>
                            <h3 className="font-serif text-xl italic text-white leading-normal">
                              Direct Soul Grant
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              Select a needy player (with 0 souls) and push a soul from the Bank reserves directly to their vessel.
                            </p>

                            <div className="space-y-3.5 pt-2" id="dealer-toolbox-panel">
                              {/* 1. Select Recipient Nickname */}
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                                  1. Recipient Nickname
                                </label>
                                <input
                                  type="text"
                                  placeholder="Type username..."
                                  value={selectedNeedyPlayer}
                                  onChange={(e) => setSelectedNeedyPlayer(e.target.value)}
                                  className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none mb-1.5"
                                />
                                <div className="text-[9px] text-zinc-500 leading-snug">
                                  Tip: Type any user nickname who has 0 souls to grant it.
                                </div>
                              </div>

                              {/* 2. Select Soul to Grant */}
                              <div>
                                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                                  2. Soul to Convey
                                </label>
                                {bankSouls.length === 0 ? (
                                  <div className="text-[10px] font-mono text-red-400">
                                    The bank carries 0 souls. Restock first!
                                  </div>
                                ) : (
                                  <select
                                    id="dealer-grant-soul-select"
                                    value={selectedBankSoulForGrant}
                                    onChange={(e) => setSelectedBankSoulForGrant(e.target.value)}
                                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
                                  >
                                    <option value="">-- Choose Soul from Bank --</option>
                                    {bankSouls.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.archetype} - Power {s.power}%)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <button
                                id="btn-submit-dealer-grant"
                                disabled={!selectedNeedyPlayer.trim() || !selectedBankSoulForGrant || loading}
                                onClick={async () => {
                                  if (!selectedNeedyPlayer.trim() || !selectedBankSoulForGrant) return;
                                  setLoading(true);
                                  setErrorMsg(null);
                                  setSuccessMsg(null);
                                  try {
                                    const res = await fetch("/api/bank/grant", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        dealerName: nickname,
                                        recipientNickname: selectedNeedyPlayer.trim(),
                                        soulId: selectedBankSoulForGrant
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setSuccessMsg(data.message || `Granted soul to ${selectedNeedyPlayer}!`);
                                      setSelectedNeedyPlayer("");
                                      setSelectedBankSoulForGrant("");
                                      fetchLedgerData();
                                    } else {
                                      setErrorMsg(data.error || "Failed to grant soul.");
                                    }
                                  } catch (e) {
                                    setErrorMsg("Failed to execute dealer grant sequence.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="w-full py-2.5 px-4 rounded-xl text-2xs font-mono tracking-widest uppercase font-extrabold text-[#050508] bg-amber-400 hover:bg-amber-300 transition-all font-bold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              >
                                {loading ? "Processing Conveyance..." : "Grant Soul to Chosen Player"}
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Right: Alchemical Swap Desk & Active Bank Catalog */}
                      <div className="md:col-span-8 space-y-8">
                        {/* 1. THE ALCHEMICAL SWAP BUREAU */}
                        <div className="bg-gradient-to-br from-[#120f1a] to-[#0a070f] border border-violet-500/10 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                          {/* Subtle background glow decorative lines */}
                          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-fuchsia-600/5 rounded-full blur-2xl pointer-events-none" />

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-violet-500/10 rounded-lg text-violet-300">
                                  <Flame className="w-4.5 h-4.5 animate-pulse text-fuchsia-400" />
                                </span>
                                <h3 className="font-serif text-2xl italic text-white">
                                  Alchemical Exchange Desk
                                </h3>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1">
                                Dissolve existing souls into the cosmic catalyst to manifest or acquire different spiritual essences.
                              </p>
                            </div>
                            <span className="text-[9px] font-mono bg-zinc-950 px-2.5 py-1 rounded border border-white/5 text-zinc-500 uppercase tracking-widest font-bold">
                              Exchange Station
                            </span>
                          </div>

                          {myOwnedSouls.length === 0 ? (
                            <div className="bg-black/30 border border-white/[0.03] rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
                              🔮 You hold 0 active soul vessels to submit for trade! <br />
                              <span className="text-[10px] text-zinc-650 block mt-2">
                                Use the "Fresh Essence" petition on the left or take the quiz to manifest your initial soul spark first.
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-5" id="exchange-desk-container">
                              {/* Selection of Offer & Target Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Choose Your Soul to Offer */}
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">
                                    I. Soul to Surrender / Swap
                                  </label>
                                  <select
                                    id="exchange-offer-select"
                                    value={exchangeOfferedSoulId}
                                    onChange={(e) => {
                                      setExchangeOfferedSoulId(e.target.value);
                                      setExchangeSelectedSacrifices([]); // dynamic reset
                                    }}
                                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:border-violet-500 focus:outline-none"
                                  >
                                    <option value="">-- Select Your Offering --</option>
                                    {myOwnedSouls.map((s) => {
                                      const isFaux = s.isFaux || s.soulType === "Faux" || s.originalOwner === "Faux Synthesizer";
                                      return (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({isFaux ? "FAUX COPY" : "ORGANIC SPARK"} - Power {s.power}%)
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Choose Desired Target */}
                                <div>
                                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">
                                    II. Target New Essence
                                  </label>
                                  <select
                                    id="exchange-target-select"
                                    value={exchangeTargetSoulId}
                                    onChange={(e) => setExchangeTargetSoulId(e.target.value)}
                                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:border-violet-500 focus:outline-none"
                                  >
                                    <option value="random">🌟 Roll Pristine Random Space Soul</option>
                                    {bankSouls.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        🎯 Bank: {s.name} ({s.archetype} - Power {s.power}%)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Math & Surcharge Pricing Logic */}
                              {exchangeOfferedSoulId && (() => {
                                const selectedSoulObj = myOwnedSouls.find(s => s.id === exchangeOfferedSoulId);
                                if (!selectedSoulObj) return null;

                                const isFauxSelected = selectedSoulObj.isFaux || selectedSoulObj.soulType === "Faux" || selectedSoulObj.originalOwner === "Faux Synthesizer";
                                
                                if (isFauxSelected) {
                                  const totalFauxCount = myOwnedSouls.filter(s => s.isFaux || s.soulType === "Faux" || s.originalOwner === "Faux Synthesizer").length;
                                  const myFauxSoulsList = myOwnedSouls.filter(s => s.isFaux || s.soulType === "Faux" || s.originalOwner === "Faux Synthesizer");
                                  const eligibleSacrifices = myFauxSoulsList.filter(s => s.id !== exchangeOfferedSoulId);

                                  const hasEnoughFuel = totalFauxCount >= 3;

                                  return (
                                    <div className="bg-zinc-950/40 border border-rose-500/10 rounded-xl p-4 space-y-4">
                                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[10px] uppercase font-mono text-rose-400 tracking-wider font-extrabold flex items-center gap-1.5">
                                          🧪 Artificial Exchange pricing
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">
                                          Fee: 1 Faux Offer + 2 Faux Sacrifices
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                                        Because you are offering an artificial <span className="text-rose-300 font-mono font-bold">Faux clone copy</span>, the Alchemist charges a premium. You must incinerate <span className="font-bold text-white">2 additional Faux souls</span> from your vessel collection as high-purity thermal fuel to synthesize the swap.
                                      </p>

                                      {!hasEnoughFuel ? (
                                        <div className="bg-rose-950/20 border border-rose-950 text-rose-300 p-3.5 rounded-lg text-2xs font-mono leading-relaxed mt-2 uppercase">
                                          ❌ Lacking Fuel Capital: You only possess {totalFauxCount} total Faux souls in your inventory (Need at least 3). Go clone your organic spark in the inventory first!
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">
                                            Select exactly 2 Faux Fuel Sacrifices (You have chosen {exchangeSelectedSacrifices.length}/2):
                                          </span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="sacrifices-picker">
                                            {eligibleSacrifices.map((s) => {
                                              const checked = exchangeSelectedSacrifices.includes(s.id);
                                              return (
                                                <button
                                                  key={s.id}
                                                  id={`btn-select-fuel-${s.id}`}
                                                  type="button"
                                                  onClick={() => {
                                                    if (checked) {
                                                      setExchangeSelectedSacrifices(prev => prev.filter(id => id !== s.id));
                                                    } else {
                                                      if (exchangeSelectedSacrifices.length >= 2) {
                                                        setExchangeSelectedSacrifices(prev => [prev[1], s.id]);
                                                      } else {
                                                        setExchangeSelectedSacrifices(prev => [...prev, s.id]);
                                                      }
                                                    }
                                                  }}
                                                  className={`flex items-center justify-between p-3 rounded-xl border text-2xs font-mono transition-all text-left cursor-pointer ${
                                                    checked
                                                      ? "bg-rose-950/45 border-rose-500/40 text-rose-300 shadow-md shadow-rose-950/10 scale-101"
                                                      : "bg-[#050508] border-white/5 text-zinc-400 hover:border-white/10"
                                                  }`}
                                                >
                                                  <span className="truncate pr-1">🔥 {s.name}</span>
                                                  <span className="text-[8px] text-zinc-600 font-bold shrink-0">
                                                    {checked ? "● SELECTED FUEL" : "○ DISCHARGE"}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                } else {
                                  // REAL ORGANIC SOUL OFFERED
                                  return (
                                    <div className="bg-amber-950/10 border border-amber-500/25 rounded-xl p-4.5 space-y-3">
                                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[10px] uppercase font-mono text-amber-400 tracking-wider font-extrabold flex items-center gap-1.5">
                                          ⚠️ SACRILEGE BARRIER DETECTED
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-400 uppercase font-extrabold">
                                          Fee: 0 Surcharge (Free)
                                        </span>
                                      </div>

                                      <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                        Your offering is a primary <span className="text-amber-300 font-bold font-mono">Organic Spark Lineage</span>. The Alchemist demands NO surcharges because real soul static is incredibly pure. 
                                      </p>
                                      
                                      <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-4 rounded-xl space-y-2 text-xs font-sans leading-relaxed">
                                        <h5 className="font-bold uppercase tracking-wide text-white text-2xs font-mono">⚠️ IRREVERSIBLE ACTION GUIDANCE</h5>
                                        We highly discourage trading away your organic sparks. You will permanently surrender your unique customized name, history logs, and pure lineage forever. Replicating a clone of this soul as a <span className="font-bold underline">Faux Copy</span> first is much safer!
                                      </div>

                                      <div className="flex items-start gap-2.5 pt-1.5">
                                        <input
                                          type="checkbox"
                                          id="cb-real-soul-consent"
                                          checked={exchangeAgreedToRealWarning}
                                          onChange={(e) => setExchangeAgreedToRealWarning(e.target.checked)}
                                          className="mt-1 h-3.5 w-3.5 border border-red-500 text-red-500 focus:ring-0 rounded bg-black cursor-pointer"
                                        />
                                        <label htmlFor="cb-real-soul-consent" className="text-2xs font-mono text-zinc-400 leading-relaxed cursor-pointer select-none">
                                          I solemnly declare that I understand the sacrifice and am willing to forfeit my organic spark's pure lineage forever.
                                        </label>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}

                              {/* Action Trigger */}
                              <button
                                id="btn-submit-alchemical-exchange"
                                disabled={
                                  !exchangeOfferedSoulId ||
                                  loading ||
                                  (() => {
                                    const selectedSoulObj = myOwnedSouls.find(s => s.id === exchangeOfferedSoulId);
                                    if (!selectedSoulObj) return true;
                                    const isFauxSelected = selectedSoulObj.isFaux || selectedSoulObj.soulType === "Faux" || selectedSoulObj.originalOwner === "Faux Synthesizer";

                                    if (isFauxSelected) {
                                      // Must have exactly 2 sacrifices chosen
                                      return exchangeSelectedSacrifices.length !== 2;
                                    } else {
                                      // Must check consent checkbox
                                      return !exchangeAgreedToRealWarning;
                                    }
                                  })()
                                }
                                onClick={async () => {
                                  if (!exchangeOfferedSoulId) return;
                                  setLoading(true);
                                  setErrorMsg(null);
                                  setSuccessMsg(null);
                                  try {
                                    const res = await fetch("/api/bank/exchange", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        nickname,
                                        offeredSoulId: exchangeOfferedSoulId,
                                        targetSoulId: exchangeTargetSoulId,
                                        fauxSacrificeIds: exchangeSelectedSacrifices
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setSuccessMsg(data.message);
                                      setExchangeOfferedSoulId("");
                                      setExchangeSelectedSacrifices([]);
                                      setExchangeAgreedToRealWarning(false);
                                      fetchLedgerData();
                                    } else {
                                      setErrorMsg(data.error || "Failed to process exchange.");
                                    }
                                  } catch (err) {
                                    setErrorMsg("Failed to communicate with Alchemical Exchange reactor.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="w-full mt-3 py-3 px-4 rounded-xl text-2xs font-mono tracking-widest uppercase font-extrabold text-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 hover:scale-[1.01] hover:brightness-105 active:translate-y-px transition-all duration-150 shadow-lg cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
                              >
                                {loading ? "Igniting Catalyst..." : "Initiate Alchemical Exchange"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. PUBLIC BANK RESERVES / THE SWAP CATALOG */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-serif text-xl italic text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                Aetheric Bank Catalog
                              </h3>
                              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                                Liquid and unvesselized spirits deposited in the vaults. Select any of these targets in the trade menu above to swap.
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                              Reserved Pool ({bankSouls.length})
                            </span>
                          </div>

                          {bankSouls.length === 0 ? (
                            <div className="bg-[#0e0e13]/40 border border-white/5 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs">
                              The bank reserves catalog is empty! Restock using the authorized panel to create new swapping choices.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="bank-souls-grid">
                              {bankSouls.map((bsoul) => (
                                <div key={bsoul.id} className="relative group">
                                  <SoulCard
                                    soul={bsoul}
                                    currentUserNickname={nickname}
                                    actionButtonLabel="Swap Into This Vessel"
                                    onViewHistory={() => setViewingSoulHistory(bsoul)}
                                    onActionButtonClick={() => {
                                      // Automatically pre-fill the swap destination!
                                      setExchangeTargetSoulId(bsoul.id);
                                      setSuccessMsg(`Pre-filled Swap Destination: "${bsoul.name}". Select your surrendering asset above!`);
                                      setTimeout(() => setSuccessMsg(null), 3500);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. ADMIN OBSERVATORY PANEL */}
                {activeTab === "admin-observatory" && isAdmin && (
                  <motion.div
                    key="tab-admin-observatory-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
                      <div>
                        <h2 className="font-serif text-3xl font-normal tracking-tight text-white flex items-center gap-2.5 italic">
                          Aetheric Admin Observatory
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1 pb-1">
                          Universal register of all transactions, burned vessels, souls, and traveler coordinates in existence.
                        </p>
                      </div>

                      <button
                        id="btn-admin-manual-refresh"
                        onClick={async () => {
                          setLoading(true);
                          await fetchAdminObservatoryData();
                          setLoading(false);
                        }}
                        className="px-4 py-2 bg-purple-650/10 hover:bg-purple-600/20 border border-violet-500/30 text-violet-300 font-mono text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Sync Registry Channels
                      </button>
                    </div>

                    {/* Stats bento layout */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Active Vessels</span>
                        <span className="text-3xl font-serif text-white italic mt-1 font-extrabold">
                          {observatoryData?.stats?.totalActiveSouls ?? souls.length}
                        </span>
                      </div>
                      <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                        <span className="font-mono text-[9px] text-rose-400 uppercase tracking-widest font-bold">Incinerated Souls</span>
                        <span className="text-3xl font-serif text-rose-400 italic mt-1 font-extrabold">
                          {observatoryData?.stats?.totalBurnedSouls ?? 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                        <span className="font-mono text-[9px] text-violet-400 uppercase tracking-widest font-bold">Total Citizens</span>
                        <span className="text-3xl font-serif text-violet-300 italic mt-1 font-extrabold">
                          {observatoryData?.stats?.totalUsersCount ?? 0}
                        </span>
                      </div>
                      <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between shadow-lg">
                        <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Swap Contracts</span>
                        <span className="text-3xl font-serif text-emerald-400 italic mt-1 font-extrabold">
                          {observatoryData?.stats?.totalTradesRecorded ?? trades.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Active Travelers Grid */}
                      <div className="lg:col-span-6 space-y-4">
                        <h3 className="font-serif italic text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-white/5">
                          <User className="w-4 h-4 text-violet-400" />
                          Citizen Registry
                        </h3>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {observatoryData?.users && observatoryData.users.length > 0 ? (
                            observatoryData.users.map((c: any) => {
                              const userSouls = (observatoryData?.activeSouls || []).filter((s: Soul) => s.owner === c.nickname);
                              return (
                                <div key={c.nickname} className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 space-y-3.5 shadow-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-sans text-sm font-bold text-zinc-200">
                                        {c.nickname}
                                      </h4>
                                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                                        COMMITTED: {new Date(c.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                      <span className="bg-violet-500/10 text-violet-350 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-violet-500/20">
                                        {userSouls.length} Active Card{userSouls.length !== 1 ? 's' : ''}
                                      </span>
                                      <span className="text-[8px] font-mono text-zinc-650 mt-1 uppercase tracking-widest">
                                        Vibe sync active
                                      </span>
                                    </div>
                                  </div>

                                  {/* Render tiny summary cards of their active souls */}
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                    {userSouls.map((us: Soul) => (
                                      <span key={us.id} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 shadow-sm">
                                        <Sparkles className="w-3 h-3 text-violet-400" />
                                        {us.name} ({us.archetype})
                                      </span>
                                    ))}
                                    {userSouls.length === 0 && (
                                      <span className="text-zinc-600 font-mono text-2xs italic">Lacks any vessel capacity. Status: Empty</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-zinc-550 font-mono text-xs italic py-6">Connecting aetheric citizens channels...</div>
                          )}
                        </div>
                      </div>

                      {/* Swap Chronicles Ledger */}
                      <div className="lg:col-span-6 space-y-4">
                        <h3 className="font-serif italic text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-white/5">
                          <ArrowLeftRight className="w-4 h-4 text-amber-500 animate-pulse" />
                          Master Swap Ledger
                        </h3>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {observatoryData?.trades && observatoryData.trades.length > 0 ? (
                            observatoryData.trades.map((t: TradeOffer) => (
                              <div key={t.id} className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-4.5 space-y-3.5 shadow-lg">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`font-mono text-[9px] px-2.5 py-0.5 rounded-md font-bold uppercase border ${
                                    t.status === "ACCEPTED" 
                                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" 
                                      : t.status === "DECLINED" 
                                      ? "bg-rose-500/10 text-rose-350 border-rose-500/30" 
                                      : t.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                                      : "bg-zinc-550/10 text-zinc-400 border-zinc-500/20"
                                  }`}>
                                    {t.status}
                                  </span>
                                  <span className="font-mono text-[9px] text-zinc-500">
                                    {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                  <span className="text-violet-300 font-bold">{t.senderName}</span> proposed trading <span className="font-serif italic font-extrabold text-white">"{t.senderSoulName}"</span> in exchange for <span className="font-serif italic font-extrabold text-white">"{t.receiverSoulName}"</span> from <span className="text-violet-350 font-bold">{t.receiverName}</span>.
                                </p>

                                <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-2xs font-mono text-zinc-400">
                                  <span className="text-zinc-650 font-extrabold block mb-1 text-[8px] uppercase tracking-widest">CONTRACT REASON METADATA:</span>
                                  "{t.reason}"
                                </div>

                                {t.responseMessage && (
                                  <div className="text-[10px] text-zinc-500 font-mono italic pl-2 border-l border-white/10">
                                    ↳ Feedback Statement: "{t.responseMessage}"
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="bg-zinc-950/25 border border-zinc-900 rounded-2xl p-10 text-center text-zinc-500 font-mono text-xs italic">
                              No swap contracts registered across the digital matrix.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pyre Registers */}
                      <div className="lg:col-span-12 space-y-4 pt-4">
                        <h3 className="font-serif italic text-xl font-bold text-white flex items-center gap-2 pb-3 border-b border-white/5">
                          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                          Pyre Registers (Permanently Incinerated Faux Vessels)
                        </h3>

                        {observatoryData?.burned && observatoryData.burned.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {observatoryData.burned.map((b: any) => (
                              <div key={b.id} className="bg-gradient-to-br from-red-950/10 via-black/40 to-stone-950/30 border border-red-500/15 p-5 pr-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[220px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.015] rounded-full blur-3xl pointer-events-none" />
                                
                                <div className="space-y-3.5">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="bg-red-550/10 text-red-300 font-mono text-[9px] font-semibold px-2.5 py-0.5 rounded-lg border border-red-500/20 uppercase tracking-widest">
                                        INCINERATION CONTRACT RECORD
                                      </span>
                                      <h4 className="font-serif italic text-xl text-white font-extrabold mt-2 leading-none">
                                        {b.soulName}
                                      </h4>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-500">
                                      {new Date(b.timestamp).toLocaleDateString()} {new Date(b.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 text-center bg-black/40 p-2.5 rounded-xl border border-white/[0.03] font-mono text-[9px] text-zinc-400">
                                    <div>
                                      <span className="block opacity-50 uppercase text-[8px] tracking-wider">ARCHETYPE</span>
                                      <span className="font-bold text-zinc-200">{b.soulSnapshot?.archetype}</span>
                                    </div>
                                    <div className="border-x border-white/10">
                                      <span className="block opacity-50 uppercase text-[8px] tracking-wider">POWER SPARK</span>
                                      <span className="font-bold text-zinc-200">{b.soulSnapshot?.power}%</span>
                                    </div>
                                    <div>
                                      <span className="block opacity-50 uppercase text-[8px] tracking-wider">BURDEN</span>
                                      <span className="font-bold text-zinc-200">{b.soulSnapshot?.weight}g</span>
                                    </div>
                                  </div>

                                  <div className="bg-black/50 p-3 rounded-xl border border-white/[0.03] text-2xs space-y-1.5">
                                    <span className="text-red-400 font-mono text-[8px] font-extrabold block uppercase tracking-wider">BURN REASON SUMMARY:</span>
                                    <p className="font-sans text-zinc-350 italic leading-relaxed">
                                      "{b.reason}"
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 pt-3 border-t border-white/5 text-[9px] font-mono gap-3">
                                  <span className="text-zinc-500">
                                    Owner at time of Pyre: <span className="text-zinc-300 font-bold">{b.owner}</span>
                                  </span>
                                  <button
                                    id={`btn-trace-burned-hist-${b.id}`}
                                    onClick={() => setViewingSoulHistory(b.soulSnapshot)}
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <History className="w-3 h-3 text-zinc-400" />
                                    Review Invariant History Logs ({b.soulSnapshot?.history?.length ?? 1} items)
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs italic">
                            The Pyre furnace holds 0 carbon duplicates. Spiritual vessels are completely healthy.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </main>
        </React.Fragment>
      )}

      {/* PROPOSAL INITIATION POPUP DIALOG (MODAL) */}
      <AnimatePresence>
        {proposingTrade && targetSoul && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050508]/92 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            id="proposal-modal-portal"
          >
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="glass-card rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-3xl relative overflow-hidden border border-white/10"
              id="proposal-form-frame"
            >
              <h3 className="font-serif italic text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight mb-2 select-none">
                Psychic Swap Proposal
              </h3>
              <p className="text-zinc-500 text-xs mb-6 font-mono uppercase tracking-widest">
                Review swap mechanics before seal is bonded
              </p>

              <form onSubmit={handleProposeTradeSubmit} className="space-y-6">
                
                {/* Visual swap timeline */}
                <div className="space-y-4 bg-white/[0.01] p-4.5 rounded-[22px] border border-white/5">
                  
                  {/* Select which soul to trade (If user has multiple!) */}
                  <div>
                    <label className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase block mb-2">
                      1. Choose Soul to Offer
                    </label>
                    
                    {myOwnedSouls.length === 0 ? (
                      <span className="text-red-400 text-xs font-mono">You do not own any vessels to trade.</span>
                    ) : (
                      <select
                        id="select-soul-choice"
                        required
                        value={offeredSoulId}
                        onChange={(e) => setOfferedSoulId(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3.5 text-sm text-zinc-300 font-mono focus:outline-none focus:border-violet-500/50"
                      >
                        <option value="" disabled>-- Choose Your Spiritual Asset --</option>
                        {myOwnedSouls.map(soul => (
                          <option key={soul.id} value={soul.id} className="font-sans text-neutral-900 bg-white">
                            {soul.name} ({soul.archetype} | Spark {soul.power}%)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex items-center justify-center py-2 text-zinc-550">
                    <ArrowLeftRight className="w-6 h-6 text-violet-500 animate-pulse" />
                  </div>

                  {/* Target Soul Card Details */}
                  <div>
                    <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase block mb-1">
                      2. Target Soul to Acquire
                    </span>
                    <div className="bg-black/60 p-4.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-emerald-400 font-mono uppercase text-[9px] font-bold block mb-0.5">
                          {targetSoul.archetype} • Owned by {targetSoul.owner}
                        </span>
                        <span className="font-serif italic font-extrabold text-white text-base leading-snug">{targetSoul.name}</span>
                      </div>
                      <div className="text-right font-mono text-[10px] text-zinc-400">
                        Purity: <span className="text-white font-bold">{targetSoul.purity}</span><br/>
                        Power: <span className="text-white font-bold">{targetSoul.power}%</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Reason for swap (Required field!) */}
                <div id="wrapper-trade-reason">
                  <label className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase block mb-1.5 font-bold">
                    Reason for Swap <span className="text-violet-400 font-bold">*</span>
                  </label>
                  <textarea
                    id="input-trade-reason"
                    required
                    placeholder="Provide a mandatory details describing why this psychic transaction is alignment-optimized..."
                    value={tradeReason}
                    onChange={(e) => setTradeReason(e.target.value)}
                    className="w-full bg-[#050508] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-xs text-zinc-200 font-sans focus:outline-none focus:border-violet-500/40 h-20 resize-none placeholder:text-zinc-650"
                  />
                </div>

                {/* Simulated Legendary Warning */}
                {!targetSoul.isCustom && (
                  <div className="bg-amber-600/10 text-amber-350 border border-amber-500/20 rounded-xl p-3.5 text-xs leading-relaxed font-sans flex gap-3 shadow-inner">
                    <Info className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <span className="font-bold">NPC AI Simulation:</span> Proposing to **{targetSoul.owner}** will trigger instant alignment evaluation by their historical personality framework. Swaps are processed immediately on accept!
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    id="btn-confirm-swap"
                    type="submit"
                    disabled={loading || !offeredSoulId || !tradeReason.trim()}
                    className="flex-1 py-4 bg-white hover:bg-neutral-100 text-black rounded-xl font-mono text-xs font-extrabold uppercase tracking-widest active:translate-y-px transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {loading ? "Transmitting..." : "Deliver Proposal"}
                  </button>
                  <button
                    id="btn-cancel-swap-dialog"
                    type="button"
                    onClick={() => {
                      setProposingTrade(false);
                      setTargetSoul(null);
                    }}
                    className="py-4 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Abort
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BURNING INCINERATION POPUP DIALOG (MODAL) */}
      <AnimatePresence>
        {burningSoul && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050508]/94 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            id="burn-modal-portal"
          >
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="glass-card rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-3xl relative overflow-hidden border border-red-500/20 bg-zinc-950/90"
              id="burn-form-frame"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
              
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg animate-pulse">
                  <Flame className="w-6 h-6" />
                </div>
              </div>

              <h3 className="font-serif italic text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-zinc-400 tracking-tight mb-2 select-none">
                Incinerate Vessel
              </h3>
              <p className="text-zinc-500 text-xs text-center font-mono uppercase tracking-widest mb-6">
                Permanent Destruction Protocol
              </p>

              <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 space-y-2 mb-6">
                <span className="font-mono text-[9px] text-red-400 font-bold block uppercase tracking-wider">WARNING DETAILED</span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans">
                  You are about to burn the simulated vessel <span className="text-white font-semibold">"{burningSoul.name}"</span>. 
                  This will permanently destroy the faux aura card and excise its record entirely from your active inventory space. 
                  <span className="text-red-300 font-bold block mt-1.5 font-mono text-[10px]">⚠️ THIS ACTION IS IMMUTABLE AND IRRECOVERABLE.</span>
                </p>
              </div>

              <form onSubmit={handleBurnSoulSubmit} className="space-y-5">
                <div>
                  <label className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase block mb-2 font-bold">
                    Enter Reason for Incineration <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="input-burn-reason"
                    required
                    placeholder="Provide a valid spiritual reason for burning this faux copy (e.g. Cleansing duplicate lines, Releasing artificial static...)"
                    value={burnReason}
                    onChange={(e) => setBurnReason(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-xs text-zinc-200 font-sans focus:outline-none focus:border-red-500/45 h-24 resize-none leading-relaxed placeholder:text-zinc-650"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    id="btn-confirm-incinerate"
                    type="submit"
                    disabled={loading || !burnReason.trim()}
                    className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-orange-650 hover:from-red-500 hover:to-orange-550 text-white rounded-xl font-mono text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer active:translate-y-px disabled:opacity-25"
                  >
                    {loading ? "Burning..." : "Commit To Fire"}
                  </button>
                  <button
                    id="btn-cancel-incinerate"
                    type="button"
                    onClick={() => {
                      setBurningSoul(null);
                    }}
                    className="py-3.5 px-5 bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Abort
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHRONICLE TRACE HISTORY POPUP DIALOG (MODAL) */}
      <AnimatePresence>
        {viewingSoulHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050508]/94 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setViewingSoulHistory(null)}
            id="history-timeline-modal-portal"
          >
            <motion.div
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-[32px] p-6 md:p-8 max-w-xl w-full shadow-3xl relative border border-white/10 max-h-[85vh] overflow-y-auto"
              id="history-timeline-frame"
            >
              {/* Close Button */}
              <button 
                onClick={() => setViewingSoulHistory(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-105 active:scale-95 duration-100 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer animate-none"
                id="btn-close-history-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6 text-left">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Trace Records
                </span>
                <h3 className="font-serif italic text-3xl font-extrabold text-white tracking-tight mt-2.5">
                  Chronology of "{viewingSoulHistory.name}"
                </h3>
                <p className="text-zinc-500 text-2xs font-mono uppercase tracking-widest mt-1">
                  Tracing historical owner transitions and spiritual weights
                </p>
              </div>

              {/* Dynamic stats cards for this soul */}
              <div className="grid grid-cols-3 gap-3.5 bg-white/[0.01] p-4 rounded-2xl border border-white/5 mb-6 text-center">
                <div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider mb-1">Archetype</div>
                  <div className="text-xs font-mono font-bold text-violet-400 capitalize">{viewingSoulHistory.archetype}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider mb-1">Aura Level</div>
                  <div className="text-xs font-mono font-bold text-amber-400">{viewingSoulHistory.power}%</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider mb-1">Current Owner</div>
                  <div className="text-xs font-mono font-semibold text-white tracking-wide truncate uppercase">{viewingSoulHistory.owner}</div>
                </div>
              </div>

              {/* Timeline Tree List */}
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10" id="soul-history-timeline-list">
                {!viewingSoulHistory.history || viewingSoulHistory.history.length === 0 ? (
                  // Deep fallback/retro-compatibility if soul has no custom history entries
                  <div className="relative pl-9 text-left">
                    <span className="absolute left-1.5 top-0.5 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                    <h4 className="font-sans text-xs text-zinc-200 font-bold">Initial Emergence Manifestation</h4>
                    <span className="font-mono text-[9px] text-zinc-500 block leading-relaxed mt-0.5">
                      Transmitted by first creator. Originally bound or generated for current vessel owner.
                    </span>
                  </div>
                ) : (
                  viewingSoulHistory.history.map((entry, index) => {
                    // Decide colors/icons for event types
                    let markerBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                    let MarkerIcon = Sparkles;
                    let titleText = "Entity Manifested";

                    if (entry.actionType === "TRADED") {
                      markerBg = "bg-violet-500/15 text-violet-300 border-violet-500/30";
                      MarkerIcon = ArrowLeftRight;
                      titleText = "Spiritual Transaction";
                    } else if (entry.actionType === "BANK_RESTOCKED") {
                      markerBg = "bg-sky-500/15 text-sky-300 border-sky-500/30";
                      MarkerIcon = Inbox;
                      titleText = "Restocked to Vaults";
                    } else if (entry.actionType === "GRANTED_BY_DEALER") {
                      markerBg = "bg-amber-500/15 text-amber-300 border-amber-500/30";
                      MarkerIcon = Shield;
                      titleText = "Welfare Replacement Grant";
                    } else if (entry.actionType === "BURNED") {
                      markerBg = "bg-red-500/15 text-red-450 border-red-500/30 animate-pulse";
                      MarkerIcon = Flame;
                      titleText = "Incinerated Vessel Pyre";
                    } else if (entry.actionType === "REPLICATED") {
                      markerBg = "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
                      MarkerIcon = Sparkles;
                      titleText = "Duplicate Vessel Replication";
                    }

                    return (
                      <div key={index} className="relative pl-9 flex flex-col items-start gap-1 text-left">
                        {/* Node timeline element */}
                        <span className={`absolute left-1.5 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${markerBg}`}>
                          <MarkerIcon className="w-2.5 h-2.5" />
                        </span>

                        <div className="flex w-full items-center justify-between gap-2">
                          <h4 className="font-sans text-xs text-zinc-200 font-bold leading-none">
                            {titleText}
                          </h4>
                          <span className="font-mono text-[8px] text-zinc-500 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded">
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-zinc-400 font-sans text-2xs leading-relaxed max-w-md pt-0.5">
                          {entry.details}
                        </p>

                        <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider pt-0.5">
                          Conducted by: <span className="text-zinc-300 font-semibold">{entry.byNickname}</span>
                          {entry.recipientNickname && (
                            <React.Fragment>
                              {" "}→ recipient: <span className="text-zinc-300 font-semibold">{entry.recipientNickname}</span>
                            </React.Fragment>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Confirm Bottom Action */}
              <button
                id="btn-close-chronicles"
                onClick={() => setViewingSoulHistory(null)}
                className="w-full mt-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-mono text-2xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Close Logs
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER COGNIZANCE */}
      <footer className="z-10 border-t border-zinc-950 mt-12 py-6 px-4 text-center font-mono text-[9px] text-zinc-600 space-y-1">
        <div>SOUL TRADER ATOMIC SYNAPSE INTERFACE — ALL SECURED MEMORY BLOCKS COMPLY STATE SPECIFICATIONS</div>
        <div>POWERED BY GOOGLE GEMINI 3.5 FLASH DEEP CONSCIOUSNESS SERVICE MODEL</div>
      </footer>

    </div>
  );
}
