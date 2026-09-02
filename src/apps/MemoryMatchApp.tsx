import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Timer,
  Clock,
  Flame,
  Award,
} from "lucide-react";

type ThemeKey = "arcade" | "space" | "animals" | "tech";
type GridSize = "easy" | "medium" | "hard";

interface ThemeConfig {
  name: string;
  icons: string[];
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  arcade: {
    name: "Arcade Retro",
    icons: ["🎮", "👾", "🕹️", "🚀", "💎", "🎲", "🏆", "⚡", "⭐", "🔮", "👑", "🔥"],
  },
  space: {
    name: "Cosmic Space",
    icons: ["🪐", "🛸", "🌌", "🌠", "☄️", "🛰️", "🚀", "👽", "🌙", "🌞", "🌍", "🔭"],
  },
  animals: {
    name: "Wildlife",
    icons: ["🦁", "🐯", "🐼", "🦊", "🐨", "🦉", "🐬", "🦄", "🦅", "🐺", "🐢", "🐙"],
  },
  tech: {
    name: "Code & Cyber",
    icons: ["💻", "🤖", "⚡", "🔋", "💾", "🛡️", "🔑", "📡", "⚙️", "📱", "🧠", "🎯"],
  },
};

const GRID_CONFIGS: Record<GridSize, { pairs: number; colsClass: string; label: string }> = {
  easy: { pairs: 6, colsClass: "grid-cols-4", label: "Casual (12 Cards)" },
  medium: { pairs: 8, colsClass: "grid-cols-4", label: "Classic (16 Cards)" },
  hard: { pairs: 12, colsClass: "grid-cols-4 sm:grid-cols-6", label: "Master (24 Cards)" },
};

interface CardItem {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatchApp: React.FC = () => {
  const [gridSize, setGridSize] = useState<GridSize>("medium");
  const [theme, setTheme] = useState<ThemeKey>("arcade");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [bestScores, setBestScores] = useState<Record<GridSize, { moves: number; time: number } | null>>(() => {
    try {
      const saved = localStorage.getItem("minipokie_memory_best");
      return saved
        ? JSON.parse(saved)
        : { easy: null, medium: null, hard: null };
    } catch {
      return { easy: null, medium: null, hard: null };
    }
  });

  const timerRef = useRef<number | null>(null);
  const lockBoardRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: "flip" | "match" | "mismatch" | "win") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "flip") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "match") {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = "triangle";
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
          noteGain.gain.setValueAtTime(0.09, now + idx * 0.07);
          noteGain.gain.linearRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + idx * 0.07);
          noteOsc.stop(now + idx * 0.07 + 0.15);
        });
      } else if (type === "mismatch") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "win") {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = "sine";
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.09);
          noteGain.gain.setValueAtTime(0.12, now + idx * 0.09);
          noteGain.gain.linearRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + idx * 0.09);
          noteOsc.stop(now + idx * 0.09 + 0.3);
        });
      }
    } catch {}
  }, [soundEnabled]);

  // Generate shuffled cards deck
  const initGame = useCallback((size: GridSize, th: ThemeKey) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const numPairs = GRID_CONFIGS[size].pairs;
    const iconsPool = THEMES[th].icons.slice(0, numPairs);
    const deckIcons = [...iconsPool, ...iconsPool];

    // Fisher-Yates shuffle
    for (let i = deckIcons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckIcons[i], deckIcons[j]] = [deckIcons[j], deckIcons[i]];
    }

    const generatedCards: CardItem[] = deckIcons.map((icon, idx) => ({
      id: idx,
      icon,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(generatedCards);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setCombo(0);
    setElapsedTime(0);
    setGameState("idle");
    lockBoardRef.current = false;
  }, []);

  useEffect(() => {
    initGame(gridSize, theme);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gridSize, theme, initGame]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const handleCardClick = (index: number) => {
    if (lockBoardRef.current || gameState === "won") return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    if (gameState === "idle") {
      setGameState("playing");
      startTimer();
    }

    playSound("flip");

    // Flip the card
    const updatedCards = [...cards];
    updatedCards[index] = { ...card, isFlipped: true };
    setCards(updatedCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.icon === secondCard.icon) {
        // Matched!
        playSound("match");
        setCombo((c) => c + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          );
          setFlippedIndices([]);

          const nextMatches = matches + 1;
          setMatches(nextMatches);

          // Check Win Condition
          if (nextMatches === GRID_CONFIGS[gridSize].pairs) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState("won");
            playSound("win");
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
            });

            // Update Best Score
            setBestScores((prev) => {
              const currentBest = prev[gridSize];
              const movesCount = moves + 1;
              const isBetter =
                !currentBest ||
                movesCount < currentBest.moves ||
                (movesCount === currentBest.moves && elapsedTime < currentBest.time);

              const updated = isBetter
                ? { ...prev, [gridSize]: { moves: movesCount, time: elapsedTime } }
                : prev;

              try {
                localStorage.setItem("minipokie_memory_best", JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }, 300);
      } else {
        // Mismatch!
        setCombo(0);
        lockBoardRef.current = true;
        setTimeout(() => {
          playSound("mismatch");
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedIndices([]);
          lockBoardRef.current = false;
        }, 800);
      }
    }
  };

  const totalPairs = GRID_CONFIGS[gridSize].pairs;
  const accuracy = moves > 0 ? Math.min(100, Math.round((matches / moves) * 100)) : 100;
  const best = bestScores[gridSize];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center">
      {/* Top Header Controls */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Difficulty Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(["easy", "medium", "hard"] as GridSize[]).map((size) => (
            <button
              key={size}
              id={`memory-size-${size}`}
              onClick={() => {
                setGridSize(size);
                initGame(size, theme);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                gridSize === size
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 hidden sm:inline">Theme:</span>
          <select
            id="memory-theme-select"
            value={theme}
            onChange={(e) => {
              const newTheme = e.target.value as ThemeKey;
              setTheme(newTheme);
              initGame(gridSize, newTheme);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
          >
            {Object.entries(THEMES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="memory-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="memory-reset-btn"
            onClick={() => initGame(gridSize, theme)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Live HUD Stats (Moves, Matches, Timer, Combo) */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Moves</div>
          <div className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{moves}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pairs Found</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {matches} / {totalPairs}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            {elapsedTime}s
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Combo</span>
          </div>
          <div className="text-xl font-black text-amber-500 mt-0.5">
            {combo > 1 ? `x${combo} 🔥` : combo === 1 ? "1" : "0"}
          </div>
        </div>
      </div>

      {/* Main Memory Cards Grid */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center">
        <div className={`w-full grid ${GRID_CONFIGS[gridSize].colsClass} gap-3 max-w-lg select-none`}>
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.id}
                id={`memory-card-${idx}`}
                onClick={() => handleCardClick(idx)}
                className="aspect-square cursor-pointer [perspective:1000px]"
              >
                <div
                  className={`w-full h-full rounded-2xl transition-all duration-300 [transform-style:preserve-3d] flex items-center justify-center shadow-sm ${
                    isRevealed ? "[transform:rotateY(180deg)]" : "hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  {/* Card Back (Hidden state) */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-lg border-2 border-indigo-400/40 shadow-inner`}
                  >
                    <Sparkles className="w-6 h-6 text-indigo-200/70" />
                  </div>

                  {/* Card Front (Revealed state) */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center text-3xl sm:text-4xl border-2 transition-colors ${
                      card.isMatched
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-600 shadow-emerald-500/10 shadow-lg"
                        : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 shadow-md"
                    }`}
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Victory Banner / Record Info */}
        <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Accuracy: <strong className="text-slate-800 dark:text-slate-200">{accuracy}%</strong></span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>
              Best Record:{" "}
              {best ? `${best.moves} moves (${best.time}s)` : "None yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
