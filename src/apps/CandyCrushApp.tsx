import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Flame,
  Lightbulb,
  Heart,
  Star,
  Play,
} from "lucide-react";

const BOARD_SIZE = 8;

export interface Candy {
  id: string;
  type: number; // 0 to 5 for standard candies
  special?: "striped-h" | "striped-v" | "wrapped" | "color-bomb";
}

const CANDY_CONFIGS = [
  { name: "Strawberry", emoji: "🍓", bg: "from-rose-500 to-red-600", text: "#f43f5e" },
  { name: "Lemon", emoji: "🍋", bg: "from-amber-400 to-yellow-500", text: "#eab308" },
  { name: "Orange", emoji: "🍊", bg: "from-orange-400 to-amber-600", text: "#f97316" },
  { name: "Lime", emoji: "🍏", bg: "from-emerald-400 to-green-600", text: "#10b981" },
  { name: "Blueberry", emoji: "🫐", bg: "from-blue-500 to-indigo-600", text: "#3b82f6" },
  { name: "Grape", emoji: "🍇", bg: "from-purple-500 to-violet-700", text: "#a855f7" },
];

export const CandyCrushApp: React.FC = () => {
  const [board, setBoard] = useState<(Candy | null)[]>([]);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(25);
  const [targetScore, setTargetScore] = useState(1500);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<"playing" | "gameover" | "victory">("playing");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [hint, setHint] = useState<[number, number] | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_candycrush_best")) || 0;
    } catch {
      return 0;
    }
  });

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

  const playSound = useCallback(
    (type: "pop" | "special" | "bomb" | "swap" | "invalid" | "win" | "combo", comboCount = 1) => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "pop" || type === "combo") {
          const baseFreq = 380 + Math.min(comboCount, 6) * 70;
          osc.type = "sine";
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === "special") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "bomb") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "swap") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === "invalid") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(160, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === "win") {
          const notes = [523, 659, 783, 1046, 1318];
          notes.forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(f, now + i * 0.07);
            g.gain.setValueAtTime(0.09, now + i * 0.07);
            g.gain.linearRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now + i * 0.07);
            o.stop(now + i * 0.07 + 0.18);
          });
        }
      } catch {}
    },
    [soundEnabled]
  );

  // Generate unique candy item
  const createCandy = (type?: number, special?: Candy["special"]): Candy => ({
    id: `candy-${Math.random().toString(36).substring(2, 9)}`,
    type: type !== undefined ? type : Math.floor(Math.random() * CANDY_CONFIGS.length),
    special,
  });

  // Check board matches without mutating
  const findMatches = (currentBoard: (Candy | null)[]) => {
    const matched = new Set<number>();
    const specialCreations: { idx: number; special: Candy["special"]; type: number }[] = [];

    // Check Horizontal matches
    for (let r = 0; r < BOARD_SIZE; r++) {
      let matchCount = 1;
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        const current = currentBoard[idx];
        const next = c < BOARD_SIZE - 1 ? currentBoard[idx + 1] : null;

        if (current && next && current.type === next.type) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let k = 0; k < matchCount; k++) {
              matched.add(r * BOARD_SIZE + (c - k));
            }
            if (matchCount === 4) {
              specialCreations.push({
                idx: r * BOARD_SIZE + (c - 1),
                special: "striped-h",
                type: currentBoard[idx]!.type,
              });
            } else if (matchCount >= 5) {
              specialCreations.push({
                idx: r * BOARD_SIZE + (c - 2),
                special: "color-bomb",
                type: 99, // Wild
              });
            }
          }
          matchCount = 1;
        }
      }
    }

    // Check Vertical matches
    for (let c = 0; c < BOARD_SIZE; c++) {
      let matchCount = 1;
      for (let r = 0; r < BOARD_SIZE; r++) {
        const idx = r * BOARD_SIZE + c;
        const current = currentBoard[idx];
        const next = r < BOARD_SIZE - 1 ? currentBoard[(r + 1) * BOARD_SIZE + c] : null;

        if (current && next && current.type === next.type) {
          matchCount++;
        } else {
          if (matchCount >= 3) {
            for (let k = 0; k < matchCount; k++) {
              matched.add((r - k) * BOARD_SIZE + c);
            }
            if (matchCount === 4) {
              specialCreations.push({
                idx: (r - 1) * BOARD_SIZE + c,
                special: "striped-v",
                type: currentBoard[idx]!.type,
              });
            } else if (matchCount >= 5) {
              specialCreations.push({
                idx: (r - 2) * BOARD_SIZE + c,
                special: "color-bomb",
                type: 99,
              });
            }
          }
          matchCount = 1;
        }
      }
    }

    return { matched: Array.from(matched), specialCreations };
  };

  // Generate initial board without pre-existing matches
  const generateCleanBoard = useCallback(() => {
    let newBoard: Candy[] = [];
    let hasMatches = true;

    while (hasMatches) {
      newBoard = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => createCandy());
      const { matched } = findMatches(newBoard);
      if (matched.length === 0) {
        hasMatches = false;
      }
    }

    return newBoard;
  }, []);

  // Initialize new game / level
  const initGame = useCallback(
    (lvl = 1) => {
      setLevel(lvl);
      const cleanBoard = generateCleanBoard();
      setBoard(cleanBoard);
      setMovesLeft(25);
      setTargetScore(lvl * 1500);
      setScore(0);
      setCombo(0);
      setGameState("playing");
      setSelectedIdx(null);
      setHint(null);
    },
    [generateCleanBoard]
  );

  useEffect(() => {
    initGame(1);
  }, [initGame]);

  // Check if two cells are adjacent (top, bottom, left, right)
  const isAdjacent = (idx1: number, idx2: number) => {
    const r1 = Math.floor(idx1 / BOARD_SIZE);
    const c1 = idx1 % BOARD_SIZE;
    const r2 = Math.floor(idx2 / BOARD_SIZE);
    const c2 = idx2 % BOARD_SIZE;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  };

  // Cascade and refill board loop
  const processMatchesAndCascade = async (initialBoard: (Candy | null)[], currentCombo = 1) => {
    setIsProcessing(true);
    let currentBoard = [...initialBoard];
    const { matched, specialCreations } = findMatches(currentBoard);

    if (matched.length === 0) {
      setIsProcessing(false);
      setCombo(0);
      return;
    }

    setCombo(currentCombo);
    playSound("pop", currentCombo);

    // Expand special candy detonations
    const allCleared = new Set<number>(matched);
    matched.forEach((idx) => {
      const candy = currentBoard[idx];
      if (!candy) return;

      if (candy.special === "striped-h") {
        const row = Math.floor(idx / BOARD_SIZE);
        for (let c = 0; c < BOARD_SIZE; c++) allCleared.add(row * BOARD_SIZE + c);
      } else if (candy.special === "striped-v") {
        const col = idx % BOARD_SIZE;
        for (let r = 0; r < BOARD_SIZE; r++) allCleared.add(r * BOARD_SIZE + col);
      } else if (candy.special === "wrapped") {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (r + dr >= 0 && r + dr < BOARD_SIZE && c + dc >= 0 && c + dc < BOARD_SIZE) {
              allCleared.add((r + dr) * BOARD_SIZE + (c + dc));
            }
          }
        }
      }
    });

    const gainedScore = allCleared.size * 50 * currentCombo;
    setScore((prev) => {
      const nextScore = prev + gainedScore;
      if (nextScore > highScore) {
        setHighScore(nextScore);
        try {
          localStorage.setItem("minipokie_candycrush_best", String(nextScore));
        } catch {}
      }
      return nextScore;
    });

    // 1. Clear matched cells
    allCleared.forEach((idx) => {
      currentBoard[idx] = null;
    });

    // Insert created special candies
    specialCreations.forEach((spec) => {
      currentBoard[spec.idx] = createCandy(spec.type === 99 ? 0 : spec.type, spec.special);
    });

    setBoard([...currentBoard]);
    await new Promise((r) => setTimeout(r, 220));

    // 2. Drop candies down by gravity
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const idx = r * BOARD_SIZE + c;
        if (currentBoard[idx] !== null) {
          if (r !== emptyRow) {
            currentBoard[emptyRow * BOARD_SIZE + c] = currentBoard[idx];
            currentBoard[idx] = null;
          }
          emptyRow--;
        }
      }
      // Fill empty top rows with new random candies
      for (let r = emptyRow; r >= 0; r--) {
        currentBoard[r * BOARD_SIZE + c] = createCandy();
      }
    }

    setBoard([...currentBoard]);
    await new Promise((r) => setTimeout(r, 220));

    // 3. Recursive cascade check
    await processMatchesAndCascade(currentBoard, currentCombo + 1);
  };

  // Handle cell click / swap
  const handleCellClick = async (idx: number) => {
    if (isProcessing || gameState !== "playing") return;
    setHint(null);

    if (selectedIdx === null) {
      setSelectedIdx(idx);
      playSound("swap");
      return;
    }

    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }

    if (!isAdjacent(selectedIdx, idx)) {
      setSelectedIdx(idx);
      playSound("swap");
      return;
    }

    const first = selectedIdx;
    const second = idx;
    setSelectedIdx(null);

    // Check Color Bomb Swap
    const candy1 = board[first];
    const candy2 = board[second];

    if (candy1?.special === "color-bomb" || candy2?.special === "color-bomb") {
      setIsProcessing(true);
      playSound("bomb");
      setMovesLeft((m) => m - 1);

      const targetType = candy1?.special === "color-bomb" ? candy2?.type : candy1?.type;
      const newBoard = [...board];
      newBoard[first] = null;
      newBoard[second] = null;

      let clearedCount = 2;
      newBoard.forEach((c, i) => {
        if (c && c.type === targetType) {
          newBoard[i] = null;
          clearedCount++;
        }
      });

      setScore((s) => s + clearedCount * 70);
      setBoard(newBoard);
      await new Promise((r) => setTimeout(r, 250));
      await processMatchesAndCascade(newBoard, 2);
      return;
    }

    // Standard Swap
    const newBoard = [...board];
    const temp = newBoard[first];
    newBoard[first] = newBoard[second];
    newBoard[second] = temp;

    const { matched } = findMatches(newBoard);

    if (matched.length > 0) {
      setBoard(newBoard);
      setMovesLeft((m) => {
        const nextMoves = m - 1;
        if (nextMoves <= 0 && score < targetScore) {
          setGameState("gameover");
        }
        return nextMoves;
      });
      await processMatchesAndCascade(newBoard, 1);
    } else {
      // Invalid move bounce
      playSound("invalid");
    }
  };

  // Check Victory / Game Over conditions
  useEffect(() => {
    if (score >= targetScore && gameState === "playing") {
      setGameState("victory");
      playSound("win");
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else if (movesLeft <= 0 && score < targetScore && gameState === "playing" && !isProcessing) {
      setGameState("gameover");
    }
  }, [score, targetScore, movesLeft, gameState, isProcessing, playSound]);

  // Find a valid move for hint
  const handleFindHint = () => {
    if (isProcessing) return;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        // Try swap right
        if (c < BOARD_SIZE - 1) {
          const testBoard = [...board];
          const t = testBoard[idx];
          testBoard[idx] = testBoard[idx + 1];
          testBoard[idx + 1] = t;
          if (findMatches(testBoard).matched.length > 0) {
            setHint([idx, idx + 1]);
            return;
          }
        }
        // Try swap down
        if (r < BOARD_SIZE - 1) {
          const testBoard = [...board];
          const t = testBoard[idx];
          testBoard[idx] = testBoard[idx + BOARD_SIZE];
          testBoard[idx + BOARD_SIZE] = t;
          if (findMatches(testBoard).matched.length > 0) {
            setHint([idx, idx + BOARD_SIZE]);
            return;
          }
        }
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 flex flex-col items-center">
      {/* Header Controls */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Candy Match Crush</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 text-xs font-bold">
            Level {level}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFindHint}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition disabled:opacity-50"
            title="Hint"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={() => initGame(1)}
            className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold text-xs hover:bg-pink-100 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* HUD Cards (Score / Target / Moves / High Score) */}
      <div className="w-full grid grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-lg font-black text-pink-600 dark:text-pink-400 font-mono mt-0.5">{score}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</div>
          <div className="text-lg font-black text-slate-800 dark:text-white font-mono mt-0.5">{targetScore}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moves</div>
          <div
            className={`text-lg font-black font-mono mt-0.5 ${
              movesLeft <= 5 ? "text-rose-500 animate-pulse" : "text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {movesLeft}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best</div>
          <div className="text-lg font-black text-amber-500 font-mono mt-0.5">{highScore}</div>
        </div>
      </div>

      {/* Combo Indicator Banner */}
      {combo > 1 && (
        <div className="w-full py-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-center font-black text-xs flex items-center justify-center gap-1.5 shadow-md animate-bounce">
          <Flame className="w-3.5 h-3.5 fill-white" />
          <span>COMBO x{combo}! +{combo * 100} BONUS</span>
        </div>
      )}

      {/* Main 8x8 Candy Grid Canvas / Interactive Board */}
      <div className="relative p-3.5 sm:p-4 rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 w-[310px] h-[310px] sm:w-[380px] sm:h-[380px]">
          {board.map((candy, idx) => {
            if (!candy) {
              return <div key={`empty-${idx}`} className="w-full h-full rounded-xl bg-slate-900/40" />;
            }

            const isSelected = selectedIdx === idx;
            const isHinted = hint?.includes(idx);
            const cfg = CANDY_CONFIGS[candy.type] || CANDY_CONFIGS[0];

            return (
              <button
                key={candy.id}
                id={`candy-cell-${idx}`}
                onClick={() => handleCellClick(idx)}
                className={`relative w-full h-full rounded-xl sm:rounded-2xl transition-all duration-150 flex items-center justify-center select-none active:scale-90 shadow-md ${
                  isSelected
                    ? "ring-4 ring-yellow-400 scale-105 z-10 brightness-110 shadow-lg"
                    : isHinted
                    ? "ring-2 ring-emerald-400 animate-pulse"
                    : "hover:scale-95"
                } ${
                  candy.special === "color-bomb"
                    ? "bg-gradient-to-br from-amber-400 via-pink-500 to-indigo-600 animate-spin-slow"
                    : `bg-gradient-to-br ${cfg.bg}`
                }`}
              >
                {/* Special Candy Overlays */}
                {candy.special === "striped-h" && (
                  <div className="absolute inset-x-0 h-1 bg-white/80 rounded-full shadow-xs" />
                )}
                {candy.special === "striped-v" && (
                  <div className="absolute inset-y-0 w-1 bg-white/80 rounded-full shadow-xs" />
                )}
                {candy.special === "wrapped" && (
                  <div className="absolute inset-1 border-2 border-white/70 border-dashed rounded-lg" />
                )}

                {/* Candy Icon */}
                <span className="text-xl sm:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {candy.special === "color-bomb" ? "🍩" : cfg.emoji}
                </span>
              </button>
            );
          })}
        </div>

        {/* Victory Overlay */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="text-3xl font-black text-amber-400 flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              <span>Sweet Victory!</span>
            </div>
            <p className="text-xs text-slate-300">
              Level {level} Cleared! Score: <strong className="text-white">{score}</strong>
            </p>
            <button
              onClick={() => initGame(level + 1)}
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Next Level {level + 1}</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="text-3xl font-black text-rose-500">Out of Moves!</div>
            <p className="text-xs text-slate-300">
              Final Score: <strong className="text-white">{score}</strong> / {targetScore}
            </p>
            <button
              onClick={() => initGame(1)}
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Control instructions */}
      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
        <span>Click 2 adjacent candies to swap and match 3+ in a row</span>
        <span>Match 4 or 5 for special power candies!</span>
      </div>
    </div>
  );
};
