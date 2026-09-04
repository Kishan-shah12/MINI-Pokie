import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Bot,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import confetti from "canvas-confetti";

type Player = "R" | "Y"; // Red vs Yellow
type CellValue = Player | null;

const COLS = 7;
const ROWS = 6;

// Audio synth
function playDropSound(freq = 400) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio
  }
}

export const ConnectFourApp: React.FC = () => {
  const [grid, setGrid] = useState<CellValue[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  const [currentPlayer, setCurrentPlayer] = useState<Player>("R"); // Red goes first
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<"ai" | "pvp">("ai");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "hard">("hard");
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [scores, setScores] = useState<{ red: number; yellow: number }>({ red: 0, yellow: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check 4-in-a-row victory
  const checkWin = useCallback(
    (b: CellValue[][]): { winner: Player; line: [number, number][] } | null => {
      // 1. Horizontal
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
          const p = b[r][c];
          if (p && p === b[r][c + 1] && p === b[r][c + 2] && p === b[r][c + 3]) {
            return {
              winner: p,
              line: [
                [r, c],
                [r, c + 1],
                [r, c + 2],
                [r, c + 3],
              ],
            };
          }
        }
      }

      // 2. Vertical
      for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c < COLS; c++) {
          const p = b[r][c];
          if (p && p === b[r + 1][c] && p === b[r + 2][c] && p === b[r + 3][c]) {
            return {
              winner: p,
              line: [
                [r, c],
                [r + 1, c],
                [r + 2, c],
                [r + 3, c],
              ],
            };
          }
        }
      }

      // 3. Diagonal Down-Right
      for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
          const p = b[r][c];
          if (p && p === b[r + 1][c + 1] && p === b[r + 2][c + 2] && p === b[r + 3][c + 3]) {
            return {
              winner: p,
              line: [
                [r, c],
                [r + 1, c + 1],
                [r + 2, c + 2],
                [r + 3, c + 3],
              ],
            };
          }
        }
      }

      // 4. Diagonal Up-Right
      for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
          const p = b[r][c];
          if (p && p === b[r - 1][c + 1] && p === b[r - 2][c + 2] && p === b[r - 3][c + 3]) {
            return {
              winner: p,
              line: [
                [r, c],
                [r - 1, c + 1],
                [r - 2, c + 2],
                [r - 3, c + 3],
              ],
            };
          }
        }
      }

      return null;
    },
    []
  );

  // Drop disc into column
  const dropDisc = useCallback(
    (col: number, player: Player, currentGrid: CellValue[][]) => {
      // Find lowest empty row in that column
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!currentGrid[r][col]) {
          targetRow = r;
          break;
        }
      }

      if (targetRow === -1) return null; // Col full

      const newGrid = currentGrid.map((row) => [...row]);
      newGrid[targetRow][col] = player;

      if (soundEnabled) {
        playDropSound(player === "R" ? 380 : 480);
      }

      // Check win
      const winResult = checkWin(newGrid);
      if (winResult) {
        setWinner(winResult.winner);
        setWinningCells(winResult.line);
        setScores((s) => ({
          ...s,
          [winResult.winner === "R" ? "red" : "yellow"]: s[winResult.winner === "R" ? "red" : "yellow"] + 1,
        }));
        confetti({ particleCount: 60, spread: 60 });
      } else if (newGrid.every((row) => row.every((c) => c !== null))) {
        setWinner("draw");
      }

      return newGrid;
    },
    [checkWin, soundEnabled]
  );

  // Handle column click
  const handleColumnClick = (col: number) => {
    if (winner || isThinking) return;
    if (gameMode === "ai" && currentPlayer === "Y") return;

    const newGrid = dropDisc(col, currentPlayer, grid);
    if (!newGrid) return;

    setGrid(newGrid);
    setCurrentPlayer(currentPlayer === "R" ? "Y" : "R");
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameMode !== "ai" || currentPlayer !== "Y" || winner) return;

    setIsThinking(true);
    const timer = setTimeout(() => {
      // 1. Check if AI can win in 1 move
      for (let c = 0; c < COLS; c++) {
        const testGrid = grid.map((r) => [...r]);
        let targetRow = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!testGrid[r][c]) {
            targetRow = r;
            break;
          }
        }
        if (targetRow !== -1) {
          testGrid[targetRow][c] = "Y";
          if (checkWin(testGrid)) {
            const nextGrid = dropDisc(c, "Y", grid);
            if (nextGrid) {
              setGrid(nextGrid);
              setCurrentPlayer("R");
            }
            setIsThinking(false);
            return;
          }
        }
      }

      // 2. Block Opponent Immediate Win
      if (aiDifficulty === "hard") {
        for (let c = 0; c < COLS; c++) {
          const testGrid = grid.map((r) => [...r]);
          let targetRow = -1;
          for (let r = ROWS - 1; r >= 0; r--) {
            if (!testGrid[r][c]) {
              targetRow = r;
              break;
            }
          }
          if (targetRow !== -1) {
            testGrid[targetRow][c] = "R";
            if (checkWin(testGrid)) {
              const nextGrid = dropDisc(c, "Y", grid);
              if (nextGrid) {
                setGrid(nextGrid);
                setCurrentPlayer("R");
              }
              setIsThinking(false);
              return;
            }
          }
        }
      }

      // 3. Prefer center columns (c = 3, then 2, 4)
      const colPreferences = [3, 2, 4, 1, 5, 0, 6];
      const validCols: number[] = [];
      for (const c of colPreferences) {
        if (!grid[0][c]) {
          validCols.push(c);
        }
      }

      if (validCols.length > 0) {
        const chosenCol =
          aiDifficulty === "hard"
            ? validCols[0]
            : validCols[Math.floor(Math.random() * validCols.length)];
        const nextGrid = dropDisc(chosenCol, "Y", grid);
        if (nextGrid) {
          setGrid(nextGrid);
          setCurrentPlayer("R");
        }
      }

      setIsThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [currentPlayer, gameMode, winner, grid, aiDifficulty, checkWin, dropDisc]);

  // Restart Round
  const resetRound = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setCurrentPlayer("R");
    setWinner(null);
    setWinningCells([]);
    setIsThinking(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-red-500 to-yellow-500 flex items-center justify-center font-black text-white text-sm shadow-sm">
            🔴
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Connect Four Pro</h2>
            <p className="text-xs text-slate-400">Tactical Drop Strategy</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                setGameMode("ai");
                resetRound();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                gameMode === "ai" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs AI
            </button>
            <button
              onClick={() => {
                setGameMode("pvp");
                resetRound();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                gameMode === "pvp" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2-Player
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={resetRound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score and Turn Banner */}
      <div className="w-full flex items-center justify-between px-5 py-2.5 bg-slate-900/70 border border-slate-800 rounded-2xl mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
          <span className="text-xs font-bold text-slate-200">Red: {scores.red}</span>
          {currentPlayer === "R" && !winner && (
            <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold">
              Turn
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentPlayer === "Y" && !winner && (
            <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
              Turn
            </span>
          )}
          <span className="text-xs font-bold text-slate-200">
            {gameMode === "ai" ? "AI" : "Yellow"}: {scores.yellow}
          </span>
          <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm" />
        </div>
      </div>

      {/* Main Connect 4 Board */}
      <div className="relative p-3 bg-blue-700 rounded-3xl border-4 border-blue-800 shadow-2xl">
        {/* Column Drop Indicator Hover bar */}
        <div className="grid grid-cols-7 gap-2 mb-2 px-1">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              onClick={() => handleColumnClick(c)}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              disabled={grid[0][c] !== null || !!winner || (gameMode === "ai" && currentPlayer === "Y")}
              className="h-8 flex items-center justify-center rounded-xl bg-blue-600/40 hover:bg-blue-500 text-white/80 transition cursor-pointer disabled:opacity-0"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* 7x6 Grid Holes */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 bg-blue-800 p-3 sm:p-4 rounded-2xl shadow-inner">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isWinningHole = winningCells.some(([wr, wc]) => wr === r && wc === c);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleColumnClick(c)}
                  disabled={grid[0][c] !== null || !!winner || (gameMode === "ai" && currentPlayer === "Y")}
                  className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    cell === "R"
                      ? "bg-red-500 shadow-inner border-2 border-red-400"
                      : cell === "Y"
                      ? "bg-yellow-400 shadow-inner border-2 border-yellow-300"
                      : "bg-slate-950/80 shadow-inner border border-blue-900/60 hover:bg-slate-900"
                  } ${isWinningHole ? "ring-4 ring-white animate-bounce" : ""}`}
                >
                  {cell && (
                    <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border border-black/10 opacity-75" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Victory Overlay */}
        {winner && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-3xl animate-in fade-in">
            <Sparkles className="w-12 h-12 text-yellow-400 mb-2" />
            <h3 className="text-2xl font-black text-white">
              {winner === "draw"
                ? "It's a Draw!"
                : `${winner === "R" ? "Red Player" : gameMode === "ai" ? "AI Bot" : "Yellow Player"} Wins!`}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Connected 4 in a row</p>
            <button
              onClick={resetRound}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg transition active:scale-95 cursor-pointer"
            >
              Play Next Round
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Click any column to drop your colored disc. Form a line of 4 horizontally, vertically, or diagonally to win!
      </p>
    </div>
  );
};
