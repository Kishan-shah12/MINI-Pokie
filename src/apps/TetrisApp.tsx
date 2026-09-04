import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCw,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  ArrowDownToLine,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

// 10x20 standard matrix
const COLS = 10;
const ROWS = 20;

// Tetromino Definitions & Colors
const SHAPES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#06b6d4", // Cyan
    name: "I",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#3b82f6", // Blue
    name: "J",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f97316", // Orange
    name: "L",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#eab308", // Yellow
    name: "O",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#22c55e", // Green
    name: "S",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a855f7", // Purple
    name: "T",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ef4444", // Red
    name: "Z",
  },
};

type PieceKey = keyof typeof SHAPES;
const PIECE_KEYS: PieceKey[] = ["I", "J", "L", "O", "S", "T", "Z"];

function randomPiece(): { key: PieceKey; matrix: number[][]; color: string } {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return {
    key,
    matrix: SHAPES[key].shape.map((r) => [...r]),
    color: SHAPES[key].color,
  };
}

// Audio synthesize helper
function playAudioTone(freq: number, type: OscillatorType = "sine", duration = 0.08) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio restrictions
  }
}

export const TetrisApp: React.FC = () => {
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  const [currentPiece, setCurrentPiece] = useState<{
    key: PieceKey;
    matrix: number[][];
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const [nextPiece, setNextPiece] = useState<{
    key: PieceKey;
    matrix: number[][];
    color: string;
  }>(() => randomPiece());

  const [holdPiece, setHoldPiece] = useState<{
    key: PieceKey;
    matrix: number[][];
    color: string;
  } | null>(null);
  const [canHold, setCanHold] = useState(true);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem("pokie_tetris_high") || "0", 10);
  });

  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Dynamic drop speed based on level
  const dropInterval = Math.max(100, 800 - (level - 1) * 70);

  // Collision detection
  const checkCollision = useCallback(
    (
      matrix: number[][],
      pos: { x: number; y: number },
      currentGrid: (string | null)[][]
    ): boolean => {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const newX = pos.x + c;
            const newY = pos.y + r;

            // Boundaries check
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            // Check established grid
            if (newY >= 0 && currentGrid[newY][newX] !== null) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Spawn new tetromino
  const spawnPiece = useCallback(() => {
    const piece = nextPiece;
    const startX = Math.floor(COLS / 2) - Math.floor(piece.matrix[0].length / 2);
    const startY = 0;

    // Check game over
    if (checkCollision(piece.matrix, { x: startX, y: startY }, grid)) {
      setGameOver(true);
      if (soundEnabled) playAudioTone(150, "sawtooth", 0.4);
      return;
    }

    setCurrentPiece({
      key: piece.key,
      matrix: piece.matrix,
      color: piece.color,
      x: startX,
      y: startY,
    });
    setNextPiece(randomPiece());
    setCanHold(true);
  }, [nextPiece, grid, checkCollision, soundEnabled]);

  // Restart game
  const resetGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setHoldPiece(null);
    setCanHold(true);
    const first = randomPiece();
    const second = randomPiece();
    const startX = Math.floor(COLS / 2) - Math.floor(first.matrix[0].length / 2);
    setCurrentPiece({
      key: first.key,
      matrix: first.matrix,
      color: first.color,
      x: startX,
      y: 0,
    });
    setNextPiece(second);
  };

  // Initial spawn
  useEffect(() => {
    resetGame();
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("pokie_tetris_high", score.toString());
    }
  }, [score, highScore]);

  // Rotate matrix
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Lock piece and clear completed lines
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newGrid = grid.map((r) => [...r]);
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const px = currentPiece.x + c;
          const py = currentPiece.y + r;
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            newGrid[py][px] = currentPiece.color;
          }
        }
      }
    }

    // Line clears
    let cleared = 0;
    const filteredGrid: (string | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      if (newGrid[r].every((cell) => cell !== null)) {
        cleared++;
      } else {
        filteredGrid.push(newGrid[r]);
      }
    }

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(null));
    }

    if (cleared > 0) {
      const pointValues = [0, 100, 300, 500, 800];
      const earned = (pointValues[cleared] || 1000) * level;
      setScore((s) => s + earned);
      setLines((l) => {
        const newTotal = l + cleared;
        const newLvl = Math.floor(newTotal / 10) + 1;
        if (newLvl > level) {
          setLevel(newLvl);
          if (soundEnabled) playAudioTone(700, "square", 0.2);
        }
        return newTotal;
      });

      if (cleared === 4) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        if (soundEnabled) playAudioTone(880, "triangle", 0.3);
      } else if (soundEnabled) {
        playAudioTone(440 + cleared * 100, "sine", 0.15);
      }
    } else if (soundEnabled) {
      playAudioTone(240, "sine", 0.05);
    }

    setGrid(filteredGrid);
    setCurrentPiece(null);
  }, [currentPiece, grid, level, soundEnabled]);

  // Move controls
  const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece.matrix, { x: currentPiece.x - 1, y: currentPiece.y }, grid)) {
      setCurrentPiece((p) => (p ? { ...p, x: p.x - 1 } : null));
      if (soundEnabled) playAudioTone(300, "sine", 0.04);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, grid, soundEnabled]);

  const moveRight = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece.matrix, { x: currentPiece.x + 1, y: currentPiece.y }, grid)) {
      setCurrentPiece((p) => (p ? { ...p, x: p.x + 1 } : null));
      if (soundEnabled) playAudioTone(300, "sine", 0.04);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, grid, soundEnabled]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotated = rotateMatrix(currentPiece.matrix);

    // Wall kick attempts
    const kicks = [0, 1, -1, 2, -2];
    for (const offset of kicks) {
      if (
        !checkCollision(
          rotated,
          { x: currentPiece.x + offset, y: currentPiece.y },
          grid
        )
      ) {
        setCurrentPiece((p) => (p ? { ...p, matrix: rotated, x: p.x + offset } : null));
        if (soundEnabled) playAudioTone(520, "sine", 0.05);
        return;
      }
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, grid, soundEnabled]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece.matrix, { x: currentPiece.x, y: currentPiece.y + 1 }, grid)) {
      setCurrentPiece((p) => (p ? { ...p, y: p.y + 1 } : null));
      setScore((s) => s + 1);
    } else {
      lockPiece();
    }
  }, [currentPiece, gameOver, isPaused, checkCollision, grid, lockPiece]);

  // Hard Drop instantly to bottom
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece.matrix, { x: currentPiece.x, y: newY + 1 }, grid)) {
      newY++;
    }
    const dropDistance = newY - currentPiece.y;
    setScore((s) => s + dropDistance * 2);
    setCurrentPiece((p) => (p ? { ...p, y: newY } : null));
    if (soundEnabled) playAudioTone(380, "sawtooth", 0.1);

    // Force instant lock
    setTimeout(() => {
      lockPiece();
    }, 20);
  }, [currentPiece, gameOver, isPaused, checkCollision, grid, lockPiece, soundEnabled]);

  // Hold piece feature
  const hold = useCallback(() => {
    if (!currentPiece || !canHold || gameOver || isPaused) return;
    if (soundEnabled) playAudioTone(600, "triangle", 0.08);

    const pieceToHold = {
      key: currentPiece.key,
      matrix: SHAPES[currentPiece.key].shape.map((r) => [...r]),
      color: currentPiece.color,
    };

    if (holdPiece) {
      const nextStartX = Math.floor(COLS / 2) - Math.floor(holdPiece.matrix[0].length / 2);
      setCurrentPiece({
        key: holdPiece.key,
        matrix: holdPiece.matrix,
        color: holdPiece.color,
        x: nextStartX,
        y: 0,
      });
      setHoldPiece(pieceToHold);
    } else {
      setHoldPiece(pieceToHold);
      setCurrentPiece(null); // will trigger spawnPiece in effect
    }
    setCanHold(false);
  }, [currentPiece, canHold, holdPiece, gameOver, isPaused, soundEnabled]);

  // Game loop tick
  useEffect(() => {
    if (gameOver || isPaused) return;

    if (!currentPiece) {
      spawnPiece();
      return;
    }

    const timer = setInterval(() => {
      moveDown();
    }, dropInterval);

    return () => clearInterval(timer);
  }, [currentPiece, gameOver, isPaused, dropInterval, moveDown, spawnPiece]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          moveLeft();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          moveRight();
          break;
        case "ArrowUp":
        case "w":
        case "W":
          rotate();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          moveDown();
          break;
        case " ":
          hardDrop();
          break;
        case "c":
        case "C":
        case "Shift":
          hold();
          break;
        case "p":
        case "P":
          setIsPaused((p) => !p);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, rotate, moveDown, hardDrop, hold]);

  // Calculate Ghost Piece (drop projection)
  const getGhostY = (): number => {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece.matrix, { x: currentPiece.x, y: ghostY + 1 }, grid)) {
      ghostY++;
    }
    return ghostY;
  };

  const ghostY = getGhostY();

  // Render combined grid (Grid + Ghost + Current Piece)
  const renderDisplayGrid = () => {
    const display = grid.map((row) => row.map((cell) => (cell ? { color: cell, ghost: false } : null)));

    // Overlay Ghost Piece
    if (currentPiece && ghostY !== currentPiece.y) {
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            const gx = currentPiece.x + c;
            const gy = ghostY + r;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
              display[gy][gx] = { color: currentPiece.color, ghost: true };
            }
          }
        }
      }
    }

    // Overlay Active Current Piece
    if (currentPiece) {
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            const px = currentPiece.x + c;
            const py = currentPiece.y + r;
            if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
              display[py][px] = { color: currentPiece.color, ghost: false };
            }
          }
        }
      }
    }

    return display;
  };

  const displayGrid = renderDisplayGrid();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
            T
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Tetris Master</h2>
            <p className="text-xs text-slate-400">Classic Arcade Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Pause / Resume"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_140px] gap-4 w-full items-start">
        {/* Left Column: HOLD Piece & Level */}
        <div className="flex flex-col gap-3 order-2 md:order-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Hold (C / Shift)
            </span>
            <div className="w-20 h-20 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center">
              {holdPiece ? (
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${holdPiece.matrix[0].length}, 14px)`,
                  }}
                >
                  {holdPiece.matrix.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="w-3.5 h-3.5 rounded-2xs"
                        style={{
                          backgroundColor: val ? holdPiece.color : "transparent",
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-600 font-mono">Empty</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Level</span>
              <span className="font-bold text-cyan-400 text-sm">{level}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Lines</span>
              <span className="font-bold text-emerald-400">{lines}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Speed</span>
              <span className="font-mono text-[11px] text-slate-300">{dropInterval}ms</span>
            </div>
          </div>
        </div>

        {/* Center Column: 10x20 Game Board */}
        <div className="relative flex justify-center order-1 md:order-2">
          <div className="relative bg-slate-950 p-2.5 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden">
            {/* Grid Canvas */}
            <div
              className="grid gap-[2px] bg-slate-900/60 p-1 rounded-xl"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(18px, 26px))`,
                gridTemplateRows: `repeat(${ROWS}, minmax(18px, 26px))`,
              }}
            >
              {displayGrid.map((row, r) =>
                row.map((cell, c) => {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`w-full aspect-square rounded-[3px] transition-colors duration-75 ${
                        cell
                          ? cell.ghost
                            ? "border border-dashed border-slate-500/50 bg-slate-800/40"
                            : "shadow-inner border border-white/20"
                          : "bg-slate-900/30 border border-slate-800/20"
                      }`}
                      style={{
                        backgroundColor: cell && !cell.ghost ? cell.color : undefined,
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">Game Over</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition active:scale-95"
                >
                  Play Again
                </button>
              </div>
            )}

            {/* Pause Overlay */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Paused</h3>
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                >
                  Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Next Piece & Score */}
        <div className="flex flex-col gap-3 order-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Next Piece
            </span>
            <div className="w-20 h-20 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${nextPiece.matrix[0].length}, 14px)`,
                }}
              >
                {nextPiece.matrix.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="w-3.5 h-3.5 rounded-2xs"
                      style={{
                        backgroundColor: val ? nextPiece.color : "transparent",
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Score
              </span>
              <p className="text-xl font-black text-white font-mono">{score}</p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Best Score
                </span>
              </div>
              <p className="text-base font-bold text-slate-200 font-mono">{highScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="w-full max-w-sm mt-5 grid grid-cols-5 gap-2 px-2">
        <button
          onClick={moveLeft}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex flex-col items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Left</span>
        </button>
        <button
          onClick={rotate}
          className="aspect-square rounded-2xl bg-indigo-600 active:bg-indigo-500 text-white flex flex-col items-center justify-center border border-indigo-500 shadow-sm transition active:scale-95"
        >
          <RotateCw className="w-5 h-5" />
          <span className="text-[9px] font-semibold text-indigo-200 mt-0.5">Rotate</span>
        </button>
        <button
          onClick={moveDown}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex flex-col items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Soft</span>
        </button>
        <button
          onClick={hardDrop}
          className="aspect-square rounded-2xl bg-amber-600 active:bg-amber-500 text-white flex flex-col items-center justify-center border border-amber-500 shadow-sm transition active:scale-95"
        >
          <ArrowDownToLine className="w-5 h-5" />
          <span className="text-[9px] font-semibold text-amber-200 mt-0.5">Drop</span>
        </button>
        <button
          onClick={moveRight}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex flex-col items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Right</span>
        </button>
      </div>

      {/* Keyboard shortcuts hints footer */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowControls((c) => !c)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showControls ? "Hide Controls" : "Keyboard Shortcuts"}</span>
        </button>

        {showControls && (
          <div className="mt-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl p-3 inline-block max-w-md text-left leading-relaxed">
            <span className="font-semibold text-slate-300">Controls:</span> ◀ / ▶ or A/D to move, ▲ or W to rotate, ▼ or S for soft drop, <span className="text-cyan-300 font-mono">SPACE</span> for instant hard drop, <span className="text-purple-300 font-mono">C</span> or <span className="text-purple-300 font-mono">Shift</span> to hold piece, <span className="text-emerald-300 font-mono">P</span> to pause.
          </div>
        )}
      </div>
    </div>
  );
};
