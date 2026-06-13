import React, { useState } from "react";
import { QUIZ_QUESTIONS } from "../data";
import { Soul } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Compass, Shield, History, Globe } from "lucide-react";
import SoulCard from "./SoulCard";

interface ManifestQuizProps {
  onManifestComplete: (soul: Soul, nickname: string) => void;
}

export default function ManifestQuiz({ onManifestComplete }: ManifestQuizProps) {
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState<"nickname" | "intro" | "questions" | "loading" | "complete">("nickname");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selectedOptionIndex: number }[]>([]);
  const [manifestedSoul, setManifestedSoul] = useState<Soul | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartIntro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setError(null);
    setStep("intro");
  };

  const handleStartQuiz = () => {
    setStep("questions");
  };

  const handleSelectOption = (optionIndex: number) => {
    const q = QUIZ_QUESTIONS[currentQIndex];
    const newAnswers = [...answers, { questionId: q.id, selectedOptionIndex: optionIndex }];
    setAnswers(newAnswers);

    if (currentQIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Last question answered - call backend to manifest soul!
      triggerSoulManifestation(newAnswers);
    }
  };

  const triggerSoulManifestation = async (finalAnswers: typeof answers) => {
    setStep("loading");
    setError(null);

    const loadingPhrases = [
      "Gathering atomic fragments...",
      "Weighing spiritual gravity index...",
      "Summoning the astral ledger...",
      "Consulting the oracle...",
      "Analyzing alignment vectors...",
      "Forging core soul card..."
    ];

    let phraseIndex = 0;
    setLoadingMsg(loadingPhrases[0]);
    const timer = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      setLoadingMsg(loadingPhrases[phraseIndex]);
    }, 1500);

    try {
      const response = await fetch("/api/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          quizAnswers: finalAnswers
        })
      });

      if (!response.ok) {
        throw new Error("Could not contact the cosmic ledger. Please retry.");
      }

      const data = await response.json();
      clearInterval(timer);
      setManifestedSoul(data.soul);
      setStep("complete");
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setError(err.message || "Failed to manifest soul.");
      setStep("nickname"); // Back to start to try again
      setAnswers([]);
      setCurrentQIndex(0);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 md:p-8" id="manifest-quiz-root">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: Spiritual Nickname selection */}
        {step === "nickname" && (
          <motion.div
            key="nickname"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-8 md:p-10 rounded-[28px] text-center"
            id="step-nickname-panel"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-violet-500/10 rounded-full border border-violet-500/20 text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl italic font-bold tracking-tight text-white mb-3">
              Sign Your Spiritual Ledger
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed font-sans">
              Before you can manifest an eternal soul and trade with other entities, choose your spiritual pseudonym in physical space.
            </p>

            {error && (
              <div className="bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl p-3.5 text-xs mb-5 text-left font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleStartIntro} className="space-y-5">
              <div className="relative">
                <input
                  id="nickname-input"
                  type="text"
                  required
                  placeholder="Enter your Spiritual Pseudonym..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.substring(0, 18))}
                  className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-violet-500/60 rounded-2xl px-5 py-4 text-center text-white placeholder-zinc-600 focus:outline-none transition-all duration-300 font-mono font-bold uppercase tracking-widest text-sm focus:ring-1 focus:ring-violet-500/30"
                />
              </div>

              <button
                id="btn-confirm-identity"
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl font-mono text-xs font-extrabold tracking-widest uppercase shadow-xl hover:shadow-violet-950/40 active:translate-y-px transition-all flex items-center justify-center gap-2"
              >
                Sign Ledger <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: The Ethereal Intro */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="glass-card p-8 md:p-10 rounded-[28px] text-center"
            id="step-intro-panel"
          >
            <h2 className="font-serif text-3xl md:text-4xl italic font-bold tracking-tight text-white mb-6">
              Welcome, {nickname}.
            </h2>
            
            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed text-left max-w-md mx-auto mb-8 font-sans">
              <p>
                Every traveller who steps into this digital ether is assigned an internal, immutable <span className="text-white font-semibold">Soul</span>.
              </p>
              <p>
                Your Soul is not a mere static stat sheet—it is an energetic entity with localized mass, power indices, alignment frequencies, and unique descriptions drafted by deep celestial AI systems.
              </p>
              <p>
                Once your Soul is manifested, it becomes property of your specific account container. You can listing it for trade, receive transactions, or barter with historical/legendary figures like Socrates or Dracula.
              </p>
              <p className="text-zinc-500 border-t border-white/5 pt-4 text-xs italic">
                Note: A mortal may carry multiple souls they have acquired by trade, but you can only manifest a starting soul once. Answer honestly.
              </p>
            </div>

            <button
              id="btn-begin-manifest"
              onClick={handleStartQuiz}
              className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl font-mono text-xs font-extrabold tracking-widest uppercase active:translate-y-px transition-all flex items-center justify-center gap-2"
            >
              Begin Manifestation <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 3: Cryptic Personality Quiz questions */}
        {step === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-6 md:p-8 rounded-[28px]"
            id="step-questions-panel"
          >
            {/* Step Indicators */}
            <div className="flex justify-between items-center mb-6">
              <span className="font-mono text-[10px] text-zinc-400 tracking-wider">
                COGNITIVE VECTOR {currentQIndex + 1} OF {QUIZ_QUESTIONS.length}
              </span>
              <div className="flex gap-1.5">
                {QUIZ_QUESTIONS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentQIndex ? "w-6 bg-violet-500" : "w-1.5 bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Text */}
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-white mb-8 leading-relaxed italic">
              {QUIZ_QUESTIONS[currentQIndex].text}
            </h3>

            {/* Answers options */}
            <div className="space-y-4">
              {QUIZ_QUESTIONS[currentQIndex].options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  id={`btn-opt-${currentQIndex}-${oIdx}`}
                  onClick={() => handleSelectOption(oIdx)}
                  className="w-full text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-4.5 text-sm text-zinc-300 hover:text-white font-sans transition-all active:scale-[0.99] flex items-start gap-4 leading-relaxed group cursor-pointer"
                >
                  <span className="bg-white/5 group-hover:bg-violet-600/20 group-hover:text-violet-400 text-zinc-400 font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center border border-white/5 flex-shrink-0 transition-colors">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 4: Cosmic loading panel */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center"
            id="step-loading-panel"
          >
            {/* Pulsing glow ring */}
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full bg-violet-600/15 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse border border-indigo-500/40" />
              <div className="absolute inset-6 rounded-full bg-black flex items-center justify-center border border-zinc-800">
                <Sparkles className="w-6 h-6 text-violet-400 animate-spin-slow" />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-white mb-2 italic">
              Summoning Celestial Code...
            </h3>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">
              {loadingMsg}
            </p>
          </motion.div>
        )}

        {/* STEP 5: Creation completed success state! */}
        {step === "complete" && manifestedSoul && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="flex flex-col items-center text-center"
            id="step-complete-panel"
          >
            <div className="mb-4">
              <span className="inline-block bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold">
                Spiritual Essence Anchored!
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2 italic">
              Behold Your Soul, {nickname}
            </h2>
            <p className="text-zinc-500 text-xs mb-8 font-sans">
              Your consciousness has finalized into a structural frequency in the database.
            </p>

            {/* Display Soul card! */}
            <div className="mb-8 w-full max-w-xs transition-all flex justify-center">
              <SoulCard
                soul={manifestedSoul}
                hoverable={false}
                currentUserNickname={nickname}
              />
            </div>

            {/* Enter ledger button */}
            <button
              id="btn-join-marketplace"
              onClick={() => onManifestComplete(manifestedSoul, nickname)}
              className="py-4 px-10 bg-white hover:bg-neutral-100 text-black rounded-2xl font-mono text-xs font-extrabold tracking-widest uppercase shadow-xl hover:shadow-white/5 active:translate-y-px transition-all duration-200 cursor-pointer"
            >
              Enter Spiritual Ledger
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
