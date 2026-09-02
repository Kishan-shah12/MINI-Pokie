import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Bomb,
  Flag,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Timer,
  Clock,
  Zap,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "Beginner (9x9)" },
  medium: { rows: 14, cols: 14, mines: 32, label: "Intermediate (14x14)" },
  hard: { rows: 16, cols: 20, mines: 55, label: "Expert (16x20)" },
};

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export const MinesweeperApp: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [firstClickDone, setFirstClickDone] = useState(false);
  const [flagMode, setFlagMode] = useState(false); // Mobile flag toggle
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number | null>>(() => {
    try {
      const saved = localStorage.getItem("minipokie_minesweeper_best");
      return saved
        ? JSON.parse(saved)
        : { easy: null, medium: null, hard: null };
    } catch {
      return { easy: null, medium: null, hard: null };
    }
  });

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: "click" | "reveal" | "flag" | "win" | "boom" | "chord") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "reveal") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "flag") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "boom") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "chord") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "win") {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = "sine";
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
          noteGain.gain.setValueAtTime(0.12, now + idx * 0.1);
          noteGain.gain.linearRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + idx * 0.1);
          noteOsc.stop(now + idx * 0.1 + 0.25);
        });
      }
    } catch {
      // Audio context ignored if blocked
    }
  }, [soundEnabled]);

  // Initialize board
  const initBoard = useCallback((diff: Difficulty) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const { rows, cols } = CONFIGS[diff];
    const newBoard: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameState("idle");
    setFlagCount(0);
    setElapsedTime(0);
    setFirstClickDone(false);
  }, []);

  useEffect(() => {
    initBoard(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, initBoard]);

  // Populate mines ensuring the first clicked cell (and surroundings) are safe
  const populateMines = (startRow: number, startCol: number, currentBoard: Cell[][]) => {
    const { rows, cols, mines } = CONFIGS[difficulty];
    const updatedBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Safe zone around first click
      const isSafeZone = Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1;
      if (!updatedBoard[r][c].isMine && !isSafeZone) {
        updatedBoard[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!updatedBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && updatedBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          updatedBoard[r][c].neighborMines = count;
        }
      }
    }

    return updatedBoard;
  };

  // Start timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  // Check victory condition
  const checkVictory = (currentBoard: Cell[][]) => {
    const { rows, cols, mines } = CONFIGS[difficulty];
    let nonMineUnrevealed = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentBoard[r][c];
        if (!cell.isMine && !cell.isRevealed) {
          nonMineUnrevealed++;
        }
      }
    }

    if (nonMineUnrevealed === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState("won");
      playSound("win");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Update best time
      setBestTimes((prev) => {
        const currentBest = prev[difficulty];
        const newBest = currentBest === null || elapsedTime < currentBest ? elapsedTime : currentBest;
        const updated = { ...prev, [difficulty]: newBest };
        try {
          localStorage.setItem("minipokie_minesweeper_best", JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  // Reveal cell logic (flood fill for zero neighbors)
  const revealCell = (r: number, c: number, activeBoard?: Cell[][]) => {
    if (gameState === "won" || gameState === "lost") return;

    let b = activeBoard ? activeBoard.map((row) => row.map((cell) => ({ ...cell }))) : board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];

    if (cell.isRevealed || cell.isFlagged) return;

    // First click guarantee
    if (!firstClickDone) {
      setFirstClickDone(true);
      setGameState("playing");
      startTimer();
      b = populateMines(r, c, b);
    }

    const target = b[r][c];

    // Stepped on a mine!
    if (target.isMine) {
      target.isRevealed = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState("lost");
      playSound("boom");

      // Reveal all mines
      for (let row = 0; row < b.length; row++) {
        for (let col = 0; col < b[0].length; col++) {
          if (b[row][col].isMine) {
            b[row][col].isRevealed = true;
          }
        }
      }
      setBoard(b);
      return;
    }

    // Flood fill
    const queue: [number, number][] = [[r, c]];
    target.isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const currCell = b[currR][currC];

      if (currCell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < b.length && nc >= 0 && nc < b[0].length) {
              const neighbor = b[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    playSound("reveal");
    setBoard(b);
    checkVictory(b);
  };

  // Toggle Flag
  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameState === "won" || gameState === "lost") return;
    if (!firstClickDone && gameState === "idle") {
      // Allow flagging before first click
      setGameState("playing");
      startTimer();
    }

    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    setFlagCount((prev) => (cell.isFlagged ? prev + 1 : prev - 1));
    playSound("flag");
    setBoard(b);
  };

  // Quick Chord on revealed numbers
  const handleChord = (r: number, c: number) => {
    const cell = board[r][c];
    if (!cell.isRevealed || cell.neighborMines === 0) return;

    let flaggedCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
          if (board[nr][nc].isFlagged) flaggedCount++;
        }
      }
    }

    if (flaggedCount === cell.neighborMines) {
      playSound("chord");
      const b = board.map((row) => row.map((c) => ({ ...c })));
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
            if (!b[nr][nc].isRevealed && !b[nr][nc].isFlagged) {
              revealCell(nr, nc, b);
            }
          }
        }
      }
    }
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1:
        return "text-blue-600 dark:text-blue-400";
      case 2:
        return "text-emerald-600 dark:text-emerald-400";
      case 3:
        return "text-rose-600 dark:text-rose-400";
      case 4:
        return "text-indigo-700 dark:text-indigo-400";
      case 5:
        return "text-amber-700 dark:text-amber-400";
      case 6:
        return "text-teal-600 dark:text-teal-400";
      case 7:
        return "text-purple-600 dark:text-purple-400";
      case 8:
        return "text-slate-800 dark:text-slate-200";
      default:
        return "text-slate-600";
    }
  };

  const currentConfig = CONFIGS[difficulty];
  const remainingMines = Math.max(0, currentConfig.mines - flagCount);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Difficulty Selectors */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              id={`ms-diff-${d}`}
              onClick={() => {
                setDifficulty(d);
                initBoard(d);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                difficulty === d
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Status Dashboard: Mines, Face Status, Timer */}
        <div className="flex items-center gap-6">
          {/* Mine Counter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border border-slate-200/60 dark:border-slate-700">
            <Bomb className="w-4 h-4 text-rose-500" />
            <span>{String(remainingMines).padStart(3, "0")}</span>
          </div>

          {/* Reset / Status Face */}
          <button
            id="ms-reset-face-btn"
            onClick={() => initBoard(difficulty)}
            className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            title="Reset Game"
          >
            {gameState === "won" ? (
              <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
            ) : gameState === "lost" ? (
              <Frown className="w-6 h-6 text-rose-500" />
            ) : gameState === "playing" ? (
              <Meh className="w-6 h-6 text-amber-600" />
            ) : (
              <Smile className="w-6 h-6 text-emerald-600" />
            )}
          </button>

          {/* Timer Counter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-100 font-mono text-sm font-bold border border-slate-200/60 dark:border-slate-700">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{String(elapsedTime).padStart(3, "0")}s</span>
          </div>
        </div>

        {/* Sound & Mobile Flag Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Flag Mode Toggle */}
          <button
            id="ms-flag-mode-toggle"
            onClick={() => setFlagMode(!flagMode)}
            className={`sm:hidden px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              flagMode
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagMode ? "Flagging" : "Digging"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="ms-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Minesweeper Board Arena */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center overflow-x-auto">
        <div
          className="grid gap-1 p-2 bg-slate-200 dark:bg-slate-950 rounded-xl select-none"
          style={{
            gridTemplateColumns: `repeat(${currentConfig.cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isMineLoss = cell.isRevealed && cell.isMine;
              return (
                <button
                  key={`${r}-${c}`}
                  id={`ms-cell-${r}-${c}`}
                  onClick={() => {
                    if (flagMode) {
                      toggleFlag(r, c);
                    } else {
                      revealCell(r, c);
                    }
                  }}
                  onDoubleClick={() => handleChord(r, c)}
                  onContextMenu={(e) => toggleFlag(r, c, e)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                    cell.isRevealed
                      ? isMineLoss
                        ? "bg-rose-500 text-white shadow-inner animate-pulse"
                        : "bg-slate-100 dark:bg-slate-900 border border-slate-300/40 dark:border-slate-800 shadow-inner"
                      : "bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 shadow-sm active:scale-95"
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-4 h-4 text-white drop-shadow" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={getNumberColor(cell.neighborMines)}>
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <Flag className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Quick Instructions & Best Times */}
        <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Left Click:</span> Dig
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Right Click:</span> Flag
            </span>
            <span className="hidden md:inline-flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Double Click Number:</span> Quick Chord
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Best ({difficulty}):{" "}
              {bestTimes[difficulty] !== null ? `${bestTimes[difficulty]}s` : "None"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
