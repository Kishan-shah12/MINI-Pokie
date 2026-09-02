import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  HelpCircle,
  Pencil,
  Eraser,
  Undo2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface CellData {
  value: number; // 0 = empty, 1-9
  initial: boolean;
  notes: Set<number>;
  error?: boolean;
}

// Complete valid 9x9 Sudoku Generator & Solver
const BLANK_BOARD = () =>
  Array(9)
    .fill(0)
    .map(() => Array(9).fill(0));

const isValidSudoku = (board: number[][], row: number, col: number, num: number): boolean => {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) return false;
    }
  }
  return true;
};

const solveBoard = (board: number[][]): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValidSudoku(board, r, c, num)) {
            board[r][c] = num;
            if (solveBoard(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateSudokuPuzzle = (diff: Difficulty): { initial: number[][]; solution: number[][] } => {
  const solved = BLANK_BOARD();
  // Seed diagonal boxes
  for (let box = 0; box < 9; box += 3) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        solved[box + r][box + c] = nums[idx++];
      }
    }
  }
  solveBoard(solved);

  const initial = solved.map((row) => [...row]);
  const clues = diff === "easy" ? 42 : diff === "medium" ? 34 : diff === "hard" ? 28 : 22;
  const toRemove = 81 - clues;

  let removed = 0;
  while (removed < toRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (initial[r][c] !== 0) {
      initial[r][c] = 0;
      removed++;
    }
  }

  return { initial, solution: solved };
};

export const SudokuApp: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<CellData[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [pencilMode, setPencilMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [history, setHistory] = useState<CellData[][][]>([]);
  const [isWon, setIsWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number>>(() => {
    try {
      const saved = localStorage.getItem("minipokie_sudoku_best");
      return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0, expert: 0 };
    } catch {
      return { easy: 0, medium: 0, hard: 0, expert: 0 };
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

  const playSound = useCallback((type: "place" | "note" | "erase" | "error" | "win" | "hint") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "place") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "note") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "hint") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "win") {
        const notes = [523, 659, 783, 1046];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + i * 0.08);
          g.gain.setValueAtTime(0.1, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.15);
        });
      }
    } catch {}
  }, [soundEnabled]);

  // Start a new game
  const initNewGame = useCallback((diff: Difficulty = difficulty) => {
    const { initial, solution: sol } = generateSudokuPuzzle(diff);
    const newBoard: CellData[][] = initial.map((row) =>
      row.map((val) => ({
        value: val,
        initial: val !== 0,
        notes: new Set<number>(),
        error: false,
      }))
    );
    setBoard(newBoard);
    setSolution(sol);
    setMistakes(0);
    setHintsUsed(0);
    setHistory([]);
    setIsWon(false);
    setTimer(0);
    setIsPaused(false);
    setSelectedCell({ r: 0, c: 0 });
  }, [difficulty]);

  useEffect(() => {
    initNewGame(difficulty);
  }, [difficulty, initNewGame]);

  // Timer ticker
  useEffect(() => {
    if (isWon || isPaused || board.length === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon, isPaused, board.length]);

  // Check victory condition
  const checkVictory = (currentBoard: CellData[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value === 0 || currentBoard[r][c].value !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  // Push history snapshot
  const pushHistory = () => {
    const snapshot = board.map((row) =>
      row.map((cell) => ({
        ...cell,
        notes: new Set(cell.notes),
      }))
    );
    setHistory((prev) => [...prev.slice(-15), snapshot]);
  };

  // Handle number entry
  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || isWon || isPaused) return;
    const { r, c } = selectedCell;
    const cell = board[r][c];
    if (cell.initial) return;

    pushHistory();

    const next = board.map((row) => row.map((cellItem) => ({ ...cellItem, notes: new Set(cellItem.notes) })));

    if (pencilMode) {
      // Toggle note
      const currentNotes = next[r][c].notes;
      if (currentNotes.has(num)) {
        currentNotes.delete(num);
      } else {
        currentNotes.add(num);
      }
      next[r][c].value = 0;
      setBoard(next);
      playSound("note");
      return;
    }

    // Direct value entry
    const isCorrect = num === solution[r][c];
    next[r][c].value = num;
    next[r][c].notes.clear();
    next[r][c].error = !isCorrect;

    if (!isCorrect) {
      setMistakes((m) => m + 1);
      playSound("error");
    } else {
      playSound("place");
      // Remove this number from notes in same row, col, and 3x3 box
      for (let i = 0; i < 9; i++) {
        next[r][i].notes.delete(num);
        next[i][c].notes.delete(num);
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          next[br + i][bc + j].notes.delete(num);
        }
      }

      if (checkVictory(next)) {
        setIsWon(true);
        playSound("win");
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        // Update best time
        setBestTimes((prev) => {
          const currentBest = prev[difficulty];
          const newBest = currentBest === 0 || timer < currentBest ? timer : currentBest;
          const updated = { ...prev, [difficulty]: newBest };
          try {
            localStorage.setItem("minipokie_sudoku_best", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    }

    setBoard(next);
  }, [selectedCell, isWon, isPaused, board, pencilMode, solution, playSound, difficulty, timer]);

  // Handle Erase
  const handleErase = useCallback(() => {
    if (!selectedCell || isWon || isPaused) return;
    const { r, c } = selectedCell;
    if (board[r][c].initial) return;

    pushHistory();
    const next = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
    next[r][c].value = 0;
    next[r][c].notes.clear();
    next[r][c].error = false;
    setBoard(next);
    playSound("erase");
  }, [selectedCell, isWon, isPaused, board, playSound]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isWon || isPaused) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(previous);
  }, [history, isWon, isPaused]);

  // Handle Hint
  const handleHint = useCallback(() => {
    if (!selectedCell || isWon || isPaused) return;
    const { r, c } = selectedCell;
    if (board[r][c].initial || board[r][c].value === solution[r][c]) return;

    pushHistory();
    const next = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
    next[r][c].value = solution[r][c];
    next[r][c].notes.clear();
    next[r][c].error = false;
    setBoard(next);
    setHintsUsed((h) => h + 1);
    playSound("hint");

    if (checkVictory(next)) {
      setIsWon(true);
      playSound("win");
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  }, [selectedCell, isWon, isPaused, board, solution, playSound]);

  // Keyboard navigation and inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon || isPaused) return;

      if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key === "n" || e.key === "N") {
        setPencilMode((p) => !p);
      } else if (e.key === "u" || e.key === "U") {
        handleUndo();
      } else if (e.key === "h" || e.key === "H") {
        handleHint();
      } else if (selectedCell) {
        let { r, c } = selectedCell;
        if (e.key === "ArrowUp") r = Math.max(0, r - 1);
        if (e.key === "ArrowDown") r = Math.min(8, r + 1);
        if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
        if (e.key === "ArrowRight") c = Math.min(8, c + 1);
        setSelectedCell({ r, c });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWon, isPaused, selectedCell, handleNumberInput, handleErase, handleUndo, handleHint]);

  // Number frequency counts remaining
  const numberCounts = Array(10).fill(0);
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell.value > 0) numberCounts[cell.value]++;
    })
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const selectedValue =
    selectedCell && board[selectedCell.r] && board[selectedCell.r][selectedCell.c]
      ? board[selectedCell.r][selectedCell.c].value
      : 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 select-none">
      {/* Top Header & Difficulty Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span>Sudoku Logic Master</span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                initNewGame(d);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                difficulty === d
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Stats Bar (Timer, Mistakes, Best Record) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timer</div>
          <div className="text-lg font-black text-slate-800 dark:text-white font-mono mt-0.5">
            {formatTime(timer)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mistakes</div>
          <div className={`text-lg font-black font-mono mt-0.5 ${mistakes > 0 ? "text-rose-500" : "text-emerald-500"}`}>
            {mistakes}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Time</div>
          <div className="text-lg font-black text-indigo-500 font-mono mt-0.5">
            {bestTimes[difficulty] > 0 ? formatTime(bestTimes[difficulty]) : "--:--"}
          </div>
        </div>
      </div>

      {/* Main 9x9 Sudoku Board */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl max-w-[420px] mx-auto">
        <div className="grid grid-cols-9 border-2 border-slate-800 dark:border-slate-400 rounded-xl overflow-hidden bg-slate-800 dark:bg-slate-400 gap-[1px]">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isSameRowOrCol = selectedCell && (selectedCell.r === r || selectedCell.c === c);
              const isSameBox =
                selectedCell &&
                Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
                Math.floor(selectedCell.c / 3) === Math.floor(c / 3);
              const isSameValue = selectedValue > 0 && cell.value === selectedValue;

              // Border accents for 3x3 subdivisions
              const isRight3 = (c + 1) % 3 === 0 && c !== 8;
              const isBottom3 = (r + 1) % 3 === 0 && r !== 8;

              let bgClass = "bg-white dark:bg-slate-900";
              if (isSelected) {
                bgClass = "bg-indigo-500 text-white";
              } else if (cell.error) {
                bgClass = "bg-rose-100 dark:bg-rose-950/80 text-rose-600";
              } else if (isSameValue) {
                bgClass = "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300";
              } else if (isSameRowOrCol || isSameBox) {
                bgClass = "bg-slate-100 dark:bg-slate-800/80";
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => setSelectedCell({ r, c })}
                  className={`relative aspect-square flex items-center justify-center cursor-pointer transition text-base sm:text-lg font-bold select-none ${bgClass} ${
                    isRight3 ? "border-r-2 border-r-slate-800 dark:border-r-slate-400" : ""
                  } ${isBottom3 ? "border-b-2 border-b-slate-800 dark:border-b-slate-400" : ""}`}
                >
                  {cell.value > 0 ? (
                    <span className={cell.initial ? "text-slate-900 dark:text-white font-black" : isSelected ? "text-white font-black" : "text-indigo-600 dark:text-indigo-400"}>
                      {cell.value}
                    </span>
                  ) : (
                    /* 3x3 Notes Grid */
                    <div className="grid grid-cols-3 w-full h-full p-0.5 text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-none pointer-events-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div key={n} className="flex items-center justify-center">
                          {cell.notes.has(n) ? n : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Controls (Undo, Erase, Pencil Notes, Hint, New Game) */}
      <div className="grid grid-cols-5 gap-2 max-w-[420px] mx-auto">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-40 transition shadow-xs"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
        </button>

        <button
          onClick={handleErase}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-xs"
        >
          <Eraser className="w-4 h-4" />
          <span>Erase</span>
        </button>

        <button
          onClick={() => setPencilMode(!pencilMode)}
          className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-xs ${
            pencilMode
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span>Notes {pencilMode ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={handleHint}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Hint</span>
        </button>

        <button
          onClick={() => initNewGame(difficulty)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      {/* Number Keypad (1 to 9) */}
      <div className="grid grid-cols-9 gap-1.5 max-w-[420px] mx-auto pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = numberCounts[num];
          const isComplete = count >= 9;

          return (
            <button
              key={num}
              disabled={isComplete}
              onClick={() => handleNumberInput(num)}
              className="py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 font-black text-lg text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center shadow-xs active:scale-95 disabled:opacity-30 transition"
            >
              <span>{num}</span>
              <span className="text-[9px] font-normal text-slate-400">{9 - count}</span>
            </button>
          );
        })}
      </div>

      {/* Victory Modal */}
      {isWon && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
          <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300">
            🎉 Puzzle Solved!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Completed in <strong className="font-mono">{formatTime(timer)}</strong> with {mistakes} mistakes and {hintsUsed} hints.
          </p>
          <button
            onClick={() => initNewGame(difficulty)}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
          >
            Play Next Puzzle
          </button>
        </div>
      )}
    </div>
  );
};
