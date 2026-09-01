import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw,
  Undo2,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";

type Board = number[][];

interface MoveHistory {
  board: Board;
  score: number;
}

export const Game2048App: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => getEmptyBoard());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("minipokie_2048_best");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [keepPlaying, setKeepPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scoreDiff, setScoreDiff] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Audio tone synthesizer using Web Audio API
  const playTone = useCallback(
    (type: "move" | "merge" | "win" | "gameover") => {
      if (!soundEnabled) return;
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === "move") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === "merge") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(330, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === "win") {
          osc.type = "square";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554, now + 0.1);
          osc.frequency.setValueAtTime(659, now + 0.2);
          osc.frequency.setValueAtTime(880, now + 0.3);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else if (type === "gameover") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.linearRampToValueAtTime(140, now + 0.25);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        }
      } catch {
        // audio context blocked by browser policy
      }
    },
    [soundEnabled]
  );

  function getEmptyBoard(): Board {
    return [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  }

  const spawnTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) return currentBoard;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[randomIndex];
    const value = Math.random() < 0.9 ? 2 : 4;

    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[r][c] = value;
    return newBoard;
  };

  // Initialize Game
  const initGame = useCallback(() => {
    let b = getEmptyBoard();
    b = spawnTile(b);
    b = spawnTile(b);
    setBoard(b);
    setScore(0);
    setHistory([]);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check if moves available
  const checkGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < 3 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < 3 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Movement Logic
  const move = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (gameOver) return;

      let moved = false;
      let addedScore = 0;
      let reached2048 = false;

      const newBoard: Board = board.map((row) => [...row]);

      const slideRow = (row: number[]): number[] => {
        let arr = row.filter((val) => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            const mergedVal = arr[i] * 2;
            arr[i] = mergedVal;
            addedScore += mergedVal;
            if (mergedVal === 2048) reached2048 = true;
            arr.splice(i + 1, 1);
          }
        }
        while (arr.length < 4) {
          arr.push(0);
        }
        return arr;
      };

      if (direction === "left") {
        for (let r = 0; r < 4; r++) {
          const original = [...newBoard[r]];
          newBoard[r] = slideRow(newBoard[r]);
          if (original.some((val, idx) => val !== newBoard[r][idx])) {
            moved = true;
          }
        }
      } else if (direction === "right") {
        for (let r = 0; r < 4; r++) {
          const original = [...newBoard[r]];
          const reversed = [...newBoard[r]].reverse();
          const slid = slideRow(reversed).reverse();
          newBoard[r] = slid;
          if (original.some((val, idx) => val !== slid[idx])) {
            moved = true;
          }
        }
      } else if (direction === "up") {
        for (let c = 0; c < 4; c++) {
          const column = [
            newBoard[0][c],
            newBoard[1][c],
            newBoard[2][c],
            newBoard[3][c],
          ];
          const slid = slideRow(column);
          for (let r = 0; r < 4; r++) {
            if (newBoard[r][c] !== slid[r]) moved = true;
            newBoard[r][c] = slid[r];
          }
        }
      } else if (direction === "down") {
        for (let c = 0; c < 4; c++) {
          const column = [
            newBoard[3][c],
            newBoard[2][c],
            newBoard[1][c],
            newBoard[0][c],
          ];
          const slid = slideRow(column).reverse();
          for (let r = 0; r < 4; r++) {
            if (newBoard[r][c] !== slid[r]) moved = true;
            newBoard[r][c] = slid[r];
          }
        }
      }

      if (moved) {
        // Save history for undo
        setHistory((prev) => [
          ...prev.slice(-10),
          { board: board.map((r) => [...r]), score },
        ]);

        const nextBoard = spawnTile(newBoard);
        setBoard(nextBoard);

        if (addedScore > 0) {
          const nextScore = score + addedScore;
          setScore(nextScore);
          setScoreDiff(addedScore);
          setTimeout(() => setScoreDiff(null), 700);

          if (nextScore > bestScore) {
            setBestScore(nextScore);
            try {
              localStorage.setItem(
                "minipokie_2048_best",
                nextScore.toString()
              );
            } catch {
              // ignore
            }
          }
          playTone("merge");
        } else {
          playTone("move");
        }

        if (reached2048 && !won && !keepPlaying) {
          setWon(true);
          playTone("win");
        }

        if (checkGameOver(nextBoard)) {
          setGameOver(true);
          playTone("gameover");
        }
      }
    },
    [board, score, bestScore, gameOver, won, keepPlaying, playTone]
  );

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if user is inside an input
      if (
        ["INPUT", "TEXTAREA"].includes(
          (document.activeElement?.tagName || "").toUpperCase()
        )
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        move("left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        move("right");
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        move("up");
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        move("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 30;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) move("right");
        else move("left");
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) move("down");
        else move("up");
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setBoard(last.board);
    setScore(last.score);
    setHistory((prev) => prev.slice(0, -1));
    setGameOver(false);
  };

  // Tile styling dictionary
  const getTileStyle = (val: number) => {
    switch (val) {
      case 2:
        return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-2xl sm:text-3xl border border-slate-200 dark:border-slate-700";
      case 4:
        return "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-extrabold text-2xl sm:text-3xl border border-amber-200 dark:border-amber-800";
      case 8:
        return "bg-orange-500 text-white font-extrabold text-2xl sm:text-3xl shadow-xs";
      case 16:
        return "bg-orange-600 text-white font-extrabold text-2xl sm:text-3xl shadow-xs";
      case 32:
        return "bg-rose-500 text-white font-extrabold text-2xl sm:text-3xl shadow-xs";
      case 64:
        return "bg-rose-600 text-white font-extrabold text-2xl sm:text-3xl shadow-xs";
      case 128:
        return "bg-yellow-400 text-slate-900 font-black text-xl sm:text-2xl shadow-md border-2 border-yellow-300";
      case 256:
        return "bg-yellow-500 text-slate-900 font-black text-xl sm:text-2xl shadow-md border-2 border-yellow-300";
      case 512:
        return "bg-emerald-500 text-white font-black text-xl sm:text-2xl shadow-md";
      case 1024:
        return "bg-indigo-600 text-white font-black text-lg sm:text-xl shadow-lg ring-2 ring-indigo-400";
      case 2048:
        return "bg-gradient-to-br from-amber-400 via-pink-500 to-indigo-600 text-white font-black text-lg sm:text-xl shadow-xl ring-4 ring-amber-300 animate-pulse";
      default:
        return val > 2048
          ? "bg-slate-900 dark:bg-black text-amber-300 font-black text-base sm:text-lg border-2 border-amber-400"
          : "bg-slate-200/50 dark:bg-slate-800/40 text-transparent";
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Info & Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              2048
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
              Puzzle Classic
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Join the numbers to get to the <strong>2048</strong> tile!
          </p>
        </div>

        {/* Score and Best Score Badges */}
        <div className="flex items-center gap-2">
          {/* Current Score */}
          <div className="relative px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center min-w-[76px] shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-slate-400">
              Score
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {score}
            </span>
            {scoreDiff !== null && (
              <span className="absolute -top-3 right-1 text-xs font-black text-emerald-600 dark:text-emerald-400 animate-bounce">
                +{scoreDiff}
              </span>
            )}
          </div>

          {/* Best Score */}
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center min-w-[76px] shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-amber-500 flex items-center justify-center gap-0.5">
              <Trophy className="w-2.5 h-2.5" /> Best
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {bestScore}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={initGame}
            id="new-game-2048-btn"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={history.length === 0 || gameOver}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
            title="Undo last move"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({history.length})</span>
          </button>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={soundEnabled ? "Mute audio" : "Enable sound FX"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 2048 Board Container */}
      <div className="relative">
        <div
          ref={boardRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="aspect-square w-full max-w-[420px] mx-auto p-3 sm:p-4 bg-slate-300/80 dark:bg-slate-800 rounded-3xl grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3.5 shadow-inner touch-none select-none relative"
        >
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-100 ${getTileStyle(
                  val
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))
          )}
        </div>

        {/* Victory Overlay Modal */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in z-20">
            <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">You Win!</h3>
              <p className="text-xs text-amber-200 mt-1">
                You merged your way up to the 2048 tile!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Keep Going
              </button>
              <button
                onClick={initGame}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay Modal */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in z-20">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Game Over!</h3>
              <p className="text-xs text-slate-300 mt-1">
                No more legal moves left on the board.
              </p>
              <p className="text-sm font-extrabold text-amber-400 mt-2">
                Final Score: {score}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo Move
                </button>
              )}
              <button
                onClick={initGame}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-screen Directional Touch Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center justify-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 mb-1">
          Controls: Swipe, use Arrow Keys / WASD, or tap buttons below:
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => move("up")}
            id="control-btn-up"
            className="w-12 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition active:scale-95 shadow-2xs"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => move("left")}
              id="control-btn-left"
              className="w-12 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => move("down")}
              id="control-btn-down"
              className="w-12 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition active:scale-95 shadow-2xs"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => move("right")}
              id="control-btn-right"
              className="w-12 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center transition active:scale-95 shadow-2xs"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Strategy Guide */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> How to Play 2048
        </h4>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Use your arrow keys, WASD, or swipe to slide all tiles in that direction.</li>
          <li>When two tiles with the same number collide, they merge into one with double the value (2+2=4, 4+4=8, etc.).</li>
          <li>Strategy tip: Try keeping your highest value tile in one corner (e.g. bottom-right) and building a chain around it!</li>
        </ul>
      </div>
    </div>
  );
};
