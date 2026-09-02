import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Bot,
  User,
  Zap,
  Sparkles,
  Grid,
  Palette,
  ShieldAlert,
} from "lucide-react";

type BoardSize = 3 | 5;
type Player = "X" | "O" | null;
type GameMode = "pve" | "pvp";
type Difficulty = "easy" | "medium" | "hard" | "unbeatable";
type Theme = "neon" | "retro" | "cyber" | "classic";

interface WinResult {
  winner: Player;
  line: number[] | null;
  isDraw: boolean;
}

export const TicTacToeApp: React.FC = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [grid, setGrid] = useState<Player[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [gameMode, setGameMode] = useState<GameMode>("pve");
  const [difficulty, setDifficulty] = useState<Difficulty>("unbeatable");
  const [theme, setTheme] = useState<Theme>("neon");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winResult, setWinResult] = useState<WinResult | null>(null);

  const [stats, setStats] = useState<{ xWins: number; oWins: number; draws: number }>(() => {
    try {
      const saved = localStorage.getItem("minipokie_tictactoe_stats");
      return saved ? JSON.parse(saved) : { xWins: 0, oWins: 0, draws: 0 };
    } catch {
      return { xWins: 0, oWins: 0, draws: 0 };
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
    (type: "x" | "o" | "win" | "draw" | "reset") => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "x") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === "o") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(290, now + 0.08);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === "win") {
          const notes = [440, 554, 659, 880];
          notes.forEach((freq, idx) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "triangle";
            o.frequency.setValueAtTime(freq, now + idx * 0.06);
            g.gain.setValueAtTime(0.1, now + idx * 0.06);
            g.gain.linearRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now + idx * 0.06);
            o.stop(now + idx * 0.06 + 0.15);
          });
        } else if (type === "draw") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(120, now + 0.2);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        }
      } catch {}
    },
    [soundEnabled]
  );

  // Check 3x3 or 5x5 win condition
  const checkWinCondition = useCallback((currentGrid: Player[], size: BoardSize): WinResult => {
    const total = size * size;
    const winLength = size === 3 ? 3 : 4; // 3 in a row for 3x3, 4 in a row for 5x5

    const lines: number[][] = [];

    // Rows
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        const line = [];
        for (let k = 0; k < winLength; k++) {
          line.push(r * size + c + k);
        }
        lines.push(line);
      }
    }

    // Cols
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - winLength; r++) {
        const line = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + c);
        }
        lines.push(line);
      }
    }

    // Diagonal (Down-Right)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        const line = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + (c + k));
        }
        lines.push(line);
      }
    }

    // Anti-Diagonal (Down-Left)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = winLength - 1; c < size; c++) {
        const line = [];
        for (let k = 0; k < winLength; k++) {
          line.push((r + k) * size + (c - k));
        }
        lines.push(line);
      }
    }

    // Check winner
    for (const line of lines) {
      const first = currentGrid[line[0]];
      if (first && line.every((idx) => currentGrid[idx] === first)) {
        return { winner: first, line, isDraw: false };
      }
    }

    const isFull = currentGrid.every((cell) => cell !== null);
    return { winner: null, line: null, isDraw: isFull };
  }, []);

  // Minimax algorithm for unbeatable 3x3 AI
  const minimax = (
    currentGrid: Player[],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number => {
    const res = checkWinCondition(currentGrid, 3);
    if (res.winner === "O") return 10 - depth;
    if (res.winner === "X") return depth - 10;
    if (res.isDraw || depth >= 7) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentGrid[i]) {
          currentGrid[i] = "O";
          const evaluation = minimax(currentGrid, depth + 1, false, alpha, beta);
          currentGrid[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentGrid[i]) {
          currentGrid[i] = "X";
          const evaluation = minimax(currentGrid, depth + 1, true, alpha, beta);
          currentGrid[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  };

  // Compute best move for AI (Player O)
  const computeAIMove = (currentGrid: Player[], size: BoardSize, diff: Difficulty): number => {
    const emptyIndices = currentGrid
      .map((val, idx) => (val === null ? idx : -1))
      .filter((idx) => idx !== -1);

    if (emptyIndices.length === 0) return -1;

    // Easy: Random move
    if (diff === "easy") {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // Medium: 50% best, 50% random
    if (diff === "medium" && Math.random() < 0.4) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // Immediate Win or Block Check for 3x3 or 5x5
    for (const idx of emptyIndices) {
      currentGrid[idx] = "O";
      if (checkWinCondition(currentGrid, size).winner === "O") {
        currentGrid[idx] = null;
        return idx;
      }
      currentGrid[idx] = null;
    }

    for (const idx of emptyIndices) {
      currentGrid[idx] = "X";
      if (checkWinCondition(currentGrid, size).winner === "X") {
        currentGrid[idx] = null;
        return idx;
      }
      currentGrid[idx] = null;
    }

    if (size === 3 && (diff === "unbeatable" || diff === "hard")) {
      // Center preference if empty
      if (currentGrid[4] === null && Math.random() < 0.85) return 4;

      let bestScore = -Infinity;
      let bestMove = emptyIndices[0];

      for (const idx of emptyIndices) {
        currentGrid[idx] = "O";
        const score = minimax(currentGrid, 0, false, -Infinity, Infinity);
        currentGrid[idx] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      return bestMove;
    }

    // 5x5 Heuristic center proximity
    const center = Math.floor((size * size) / 2);
    if (currentGrid[center] === null) return center;

    // Pick closest to center
    emptyIndices.sort((a, b) => {
      const distA = Math.abs(Math.floor(a / size) - Math.floor(size / 2)) + Math.abs((a % size) - Math.floor(size / 2));
      const distB = Math.abs(Math.floor(b / size) - Math.floor(size / 2)) + Math.abs((b % size) - Math.floor(size / 2));
      return distA - distB;
    });

    return emptyIndices[0];
  };

  const handleCellClick = (index: number) => {
    if (grid[index] !== null || winResult !== null) return;
    if (gameMode === "pve" && turn !== "X") return;

    const newGrid = [...grid];
    newGrid[index] = turn;
    setGrid(newGrid);
    playSound(turn === "X" ? "x" : "o");

    const result = checkWinCondition(newGrid, boardSize);
    if (result.winner || result.isDraw) {
      handleGameOver(result);
      return;
    }

    const nextTurn = turn === "X" ? "O" : "X";
    setTurn(nextTurn);
  };

  // Trigger AI turn in PvE
  useEffect(() => {
    if (gameMode === "pve" && turn === "O" && !winResult) {
      const timer = setTimeout(() => {
        const aiMove = computeAIMove([...grid], boardSize, difficulty);
        if (aiMove !== -1) {
          const newGrid = [...grid];
          newGrid[aiMove] = "O";
          setGrid(newGrid);
          playSound("o");

          const result = checkWinCondition(newGrid, boardSize);
          if (result.winner || result.isDraw) {
            handleGameOver(result);
          } else {
            setTurn("X");
          }
        }
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, grid, boardSize, difficulty, winResult, checkWinCondition, playSound]);

  const handleGameOver = (result: WinResult) => {
    setWinResult(result);
    if (result.winner === "X") {
      playSound("win");
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setStats((prev) => {
        const next = { ...prev, xWins: prev.xWins + 1 };
        localStorage.setItem("minipokie_tictactoe_stats", JSON.stringify(next));
        return next;
      });
    } else if (result.winner === "O") {
      playSound("win");
      if (gameMode === "pvp") {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
      setStats((prev) => {
        const next = { ...prev, oWins: prev.oWins + 1 };
        localStorage.setItem("minipokie_tictactoe_stats", JSON.stringify(next));
        return next;
      });
    } else if (result.isDraw) {
      playSound("draw");
      setStats((prev) => {
        const next = { ...prev, draws: prev.draws + 1 };
        localStorage.setItem("minipokie_tictactoe_stats", JSON.stringify(next));
        return next;
      });
    }
  };

  const handleResetGame = () => {
    setGrid(Array(boardSize * boardSize).fill(null));
    setTurn("X");
    setWinResult(null);
  };

  const handleSwitchBoardSize = (newSize: BoardSize) => {
    setBoardSize(newSize);
    setGrid(Array(newSize * newSize).fill(null));
    setTurn("X");
    setWinResult(null);
  };

  // Theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case "neon":
        return {
          container: "bg-slate-950 border-slate-800 text-white",
          cell: "bg-slate-900/90 border-slate-800 hover:border-indigo-500/50 shadow-inner",
          cellWin: "bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20",
          xText: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]",
          oText: "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]",
        };
      case "cyber":
        return {
          container: "bg-zinc-950 border-emerald-900/60 text-emerald-400",
          cell: "bg-zinc-900 border-zinc-800 hover:border-emerald-500/50",
          cellWin: "bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-500/30",
          xText: "text-emerald-400 font-mono",
          oText: "text-amber-400 font-mono",
        };
      case "retro":
        return {
          container: "bg-amber-50 dark:bg-stone-900 border-amber-200 dark:border-stone-800",
          cell: "bg-white dark:bg-stone-800 border-amber-200 dark:border-stone-700 hover:border-amber-400",
          cellWin: "bg-amber-200/80 dark:bg-amber-950/80 border-amber-500",
          xText: "text-blue-600 dark:text-blue-400",
          oText: "text-amber-600 dark:text-amber-400",
        };
      default: // classic
        return {
          container: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
          cell: "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400",
          cellWin: "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500",
          xText: "text-indigo-600 dark:text-indigo-400",
          oText: "text-rose-500 dark:text-rose-400",
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 flex flex-col items-center">
      {/* Top Header & Settings */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Tic Tac Toe Pro</span>
          </div>

          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
            <button
              onClick={() => handleSwitchBoardSize(3)}
              className={`px-2.5 py-1 rounded-md transition ${
                boardSize === 3
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500"
              }`}
            >
              3×3 Classic
            </button>
            <button
              onClick={() => handleSwitchBoardSize(5)}
              className={`px-2.5 py-1 rounded-md transition ${
                boardSize === 5
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500"
              }`}
            >
              5×5 (4 in a row)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetGame}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Mode, Difficulty, & Theme Selector Bar */}
      <div className="w-full grid grid-cols-3 gap-2 text-xs font-bold">
        {/* Game Mode */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => {
              setGameMode("pve");
              handleResetGame();
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              gameMode === "pve"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            onClick={() => {
              setGameMode("pvp");
              handleResetGame();
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              gameMode === "pvp"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2-Player</span>
          </button>
        </div>

        {/* AI Difficulty (if PvE) */}
        {gameMode === "pve" ? (
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as Difficulty);
              handleResetGame();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
          >
            <option value="easy">Easy AI</option>
            <option value="medium">Medium AI</option>
            <option value="hard">Hard AI</option>
            <option value="unbeatable">Unbeatable AI 🔥</option>
          </select>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-500 text-xs">
            Pass & Play Mode
          </div>
        )}

        {/* Theme Selector */}
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
        >
          <option value="neon">Neon Cyberpunk ✨</option>
          <option value="classic">Modern Clean</option>
          <option value="cyber">Matrix Terminal</option>
          <option value="retro">Warm Retro</option>
        </select>
      </div>

      {/* Score HUD */}
      <div className="w-full grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Player X {gameMode === "pve" ? "(You)" : ""}
          </div>
          <div className="text-xl font-black text-cyan-500 font-mono mt-0.5">{stats.xWins}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draws</div>
          <div className="text-xl font-black text-slate-500 font-mono mt-0.5">{stats.draws}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Player O {gameMode === "pve" ? "(AI)" : ""}
          </div>
          <div className="text-xl font-black text-rose-500 font-mono mt-0.5">{stats.oWins}</div>
        </div>
      </div>

      {/* Turn Indicator / Winner Banner */}
      <div className="w-full py-2 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
        {winResult ? (
          winResult.winner ? (
            <span className="text-amber-500 flex items-center gap-1.5 animate-bounce">
              <Trophy className="w-4 h-4" />
              <span>
                Player {winResult.winner} Won the Game!
              </span>
            </span>
          ) : (
            <span className="text-slate-500">Game ended in a Draw!</span>
          )
        ) : (
          <span className="flex items-center gap-2">
            <span>Current Turn:</span>
            <strong
              className={`px-2 py-0.5 rounded-md ${
                turn === "X"
                  ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              Player {turn} {gameMode === "pve" && turn === "O" ? "(AI Thinking...)" : ""}
            </strong>
          </span>
        )}
      </div>

      {/* Main Game Grid Board */}
      <div
        className={`p-4 sm:p-6 rounded-3xl border-2 shadow-2xl transition-all duration-300 ${themeStyles.container}`}
      >
        <div
          className={`grid gap-2 sm:gap-3 select-none ${
            boardSize === 3
              ? "grid-cols-3 w-[290px] h-[290px] sm:w-[340px] sm:h-[340px]"
              : "grid-cols-5 w-[310px] h-[310px] sm:w-[380px] sm:h-[380px]"
          }`}
        >
          {grid.map((cell, idx) => {
            const isWinningCell = winResult?.line?.includes(idx);
            return (
              <button
                key={idx}
                id={`ttt-cell-${idx}`}
                onClick={() => handleCellClick(idx)}
                disabled={cell !== null || winResult !== null || (gameMode === "pve" && turn === "O")}
                className={`flex items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95 ${
                  isWinningCell ? themeStyles.cellWin : themeStyles.cell
                } ${
                  boardSize === 3
                    ? "text-4xl sm:text-5xl font-black"
                    : "text-2xl sm:text-3xl font-black"
                }`}
              >
                {cell === "X" && (
                  <span className={`animate-in zoom-in-50 duration-150 ${themeStyles.xText}`}>
                    X
                  </span>
                )}
                {cell === "O" && (
                  <span className={`animate-in zoom-in-50 duration-150 ${themeStyles.oText}`}>
                    O
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
