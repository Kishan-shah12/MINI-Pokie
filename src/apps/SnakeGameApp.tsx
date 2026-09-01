import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Gamepad2,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Star,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
} from "lucide-react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Point {
  x: number;
  y: number;
}

interface FoodItem {
  x: number;
  y: number;
  type: "normal" | "golden" | "speed" | "ghost";
  expiresAt?: number;
}

const GRID_SIZE = 22;

export const SnakeGameApp: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Direction>("UP");
  const [nextDirection, setNextDirection] = useState<Direction>("UP");
  const [food, setFood] = useState<FoodItem>({ x: 5, y: 5, type: "normal" });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_snake_highscore")) || 0;
    } catch {
      return 0;
    }
  });

  const [difficulty, setDifficulty] = useState<"casual" | "classic" | "blitz" | "nightmare">("classic");
  const [gameState, setGameState] = useState<"ready" | "playing" | "paused" | "gameover">("ready");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ghostActive, setGhostActive] = useState(false);
  const [speedActive, setSpeedActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Difficulty base intervals (ms)
  const speedIntervals = {
    casual: 140,
    classic: 100,
    blitz: 70,
    nightmare: 45,
  };

  // Sound Synth Helper (Web Audio API)
  const playTone = useCallback((freq: number, type: OscillatorType, duration: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked
    }
  }, [soundEnabled]);

  // Spawn random food
  const generateFood = useCallback((currentSnake: Point[]): FoodItem => {
    let newX: number;
    let newY: number;
    let collision: boolean;

    do {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      collision = currentSnake.some((segment) => segment.x === newX && segment.y === newY);
    } while (collision);

    // Random food type chance: 75% normal, 12% golden, 8% speed, 5% ghost
    const rand = Math.random();
    let type: "normal" | "golden" | "speed" | "ghost" = "normal";
    if (rand > 0.93) type = "ghost";
    else if (rand > 0.85) type = "speed";
    else if (rand > 0.72) type = "golden";

    return { x: newX, y: newY, type };
  }, []);

  // Start / Restart Game
  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection("UP");
    setNextDirection("UP");
    setScore(0);
    setGhostActive(false);
    setSpeedActive(false);
    setFood(generateFood(initialSnake));
    setGameState("playing");
    playTone(440, "sine", 0.15);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          e.preventDefault();
          if (direction !== "DOWN") setNextDirection("UP");
        } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          if (direction !== "UP") setNextDirection("DOWN");
        } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          e.preventDefault();
          if (direction !== "RIGHT") setNextDirection("LEFT");
        } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          e.preventDefault();
          if (direction !== "LEFT") setNextDirection("RIGHT");
        } else if (e.key === " " || e.key === "Escape") {
          e.preventDefault();
          setGameState("paused");
        }
      } else if (gameState === "paused") {
        if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setGameState("playing");
        }
      } else if (gameState === "ready" || gameState === "gameover") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, direction]);

  // Main game tick loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let currentInterval = speedIntervals[difficulty];
    if (speedActive) currentInterval = Math.max(35, currentInterval * 0.7);

    const timer = setInterval(() => {
      setDirection(nextDirection);

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (nextDirection) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        // Wall collisions
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Self collisions (unless ghost is active)
        if (!ghostActive && prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check if food eaten
        if (head.x === food.x && head.y === food.y) {
          let points = 10;
          if (food.type === "golden") {
            points = 50;
            playTone(880, "triangle", 0.3);
          } else if (food.type === "speed") {
            points = 30;
            setSpeedActive(true);
            setTimeout(() => setSpeedActive(false), 5000);
            playTone(660, "sawtooth", 0.2);
          } else if (food.type === "ghost") {
            points = 40;
            setGhostActive(true);
            setTimeout(() => setGhostActive(false), 6000);
            playTone(550, "sine", 0.4);
          } else {
            playTone(520, "sine", 0.1);
          }

          const newScore = score + points;
          setScore(newScore);

          if (newScore > highScore) {
            setHighScore(newScore);
            try {
              localStorage.setItem("minipokie_snake_highscore", String(newScore));
            } catch {}
          }

          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, currentInterval);

    return () => clearInterval(timer);
  }, [gameState, nextDirection, food, difficulty, speedActive, ghostActive, score, highScore, generateFood, playTone]);

  const handleGameOver = () => {
    setGameState("gameover");
    playTone(180, "sawtooth", 0.4);

    if (score > 0 && score >= highScore) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.42;

    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);

    if (food.type === "golden") {
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 12;
    } else if (food.type === "speed") {
      ctx.fillStyle = "#f97316";
      ctx.shadowColor = "#ea580c";
      ctx.shadowBlur = 12;
    } else if (food.type === "ghost") {
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 14;
    } else {
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = 8;
    }

    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Draw Snake
    snake.forEach((segment, index) => {
      const sx = segment.x * cellSize;
      const sy = segment.y * cellSize;

      if (index === 0) {
        // Head
        ctx.fillStyle = ghostActive ? "#38bdf8" : speedActive ? "#f97316" : "#10b981";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = "#0f172a";
        const eyeOffset = cellSize * 0.28;
        const eyeSize = cellSize * 0.16;

        let leftEye = { x: sx + eyeOffset, y: sy + eyeOffset };
        let rightEye = { x: sx + cellSize - eyeOffset, y: sy + eyeOffset };

        if (direction === "DOWN") {
          leftEye = { x: sx + eyeOffset, y: sy + cellSize - eyeOffset };
          rightEye = { x: sx + cellSize - eyeOffset, y: sy + cellSize - eyeOffset };
        } else if (direction === "LEFT") {
          leftEye = { x: sx + eyeOffset, y: sy + eyeOffset };
          rightEye = { x: sx + eyeOffset, y: sy + cellSize - eyeOffset };
        } else if (direction === "RIGHT") {
          leftEye = { x: sx + cellSize - eyeOffset, y: sy + eyeOffset };
          rightEye = { x: sx + cellSize - eyeOffset, y: sy + cellSize - eyeOffset };
        }

        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeSize, 0, Math.PI * 2);
        ctx.arc(rightEye.x, rightEye.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segments
        const alpha = Math.max(0.4, 1 - index / (snake.length + 5));
        if (ghostActive) {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.6})`;
        } else if (speedActive) {
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        }

        ctx.beginPath();
        ctx.roundRect(sx + 3, sy + 3, cellSize - 6, cellSize - 6, 4);
        ctx.fill();
      }
    });
  }, [snake, food, direction, ghostActive, speedActive]);

  return (
    <div id="snake-game-app" className="max-w-4xl mx-auto space-y-5">
      {/* Top Controls & Scoreboard */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Snake Classic & Arcade</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Eat apples, catch special power-ups, and set high score records!
            </p>
          </div>
        </div>

        {/* Score Counters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Score: </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-sm">{score}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Best: </span>
              <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-sm">{highScore}</span>
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Game Stage + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Area */}
        <div className="lg:col-span-8 bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Active Powerup Badges */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {speedActive && (
              <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3.5 h-3.5" /> Turbo Boost
              </span>
            )}
            {ghostActive && (
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1 animate-pulse">
                <Star className="w-3.5 h-3.5" /> Ghost Phase
              </span>
            )}
          </div>

          <div className="relative w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden shadow-inner border border-slate-800 bg-slate-900 flex items-center justify-center">
            <canvas ref={canvasRef} width={480} height={480} className="w-full h-full object-contain" />

            {/* Overlays */}
            {gameState === "ready" && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Snake Retro Arcade</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Use Arrow Keys, WASD, or the Mobile D-Pad. Eat fruits and avoid crashing into walls.
                  </p>
                </div>
                <button
                  id="snake-start-btn"
                  onClick={startGame}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Game
                </button>
              </div>
            )}

            {gameState === "paused" && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Pause className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Game Paused</h3>
                <button
                  onClick={() => setGameState("playing")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
                >
                  Resume Playing
                </button>
              </div>
            )}

            {gameState === "gameover" && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-3">
                <span className="text-xs uppercase tracking-widest font-bold text-rose-400">Game Over</span>
                <h3 className="text-2xl font-extrabold text-white">Score: {score}</h3>
                {score >= highScore && score > 0 && (
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> New Record Achieved!
                  </span>
                )}
                <div className="pt-2">
                  <button
                    id="snake-restart-btn"
                    onClick={startGame}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-lg transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Touch D-Pad */}
          <div className="mt-4 flex flex-col items-center gap-1.5 sm:hidden">
            <button
              onClick={() => {
                if (direction !== "DOWN") setNextDirection("UP");
              }}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (direction !== "RIGHT") setNextDirection("LEFT");
                }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  if (gameState === "playing") setGameState("paused");
                  else if (gameState === "paused") setGameState("playing");
                  else startGame();
                }}
                className="w-12 h-12 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md"
              >
                {gameState === "playing" ? "II" : "GO"}
              </button>
              <button
                onClick={() => {
                  if (direction !== "LEFT") setNextDirection("RIGHT");
                }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={() => {
                if (direction !== "UP") setNextDirection("DOWN");
              }}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right Settings & Legend Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Difficulty options */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Speed & Difficulty
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["casual", "classic", "blitz", "nightmare"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDifficulty(mode)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition ${
                    difficulty === mode
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Fruit / Power-up Legend */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Fruit & Power-Up Legend
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-rose-500 shadow-sm shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Red Apple:</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">+10 pts standard growth</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-amber-400 shadow-sm shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Golden Apple:</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">+50 pts high value</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-orange-500 shadow-sm shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Speed Chili:</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">+30 pts + temporary speed boost</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-sky-400 shadow-sm shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Ghost Berry:</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">+40 pts + phase through tail</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Controls guide */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Desktop Shortcuts:</p>
            <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">W A S D</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Arrows</kbd> to steer</p>
            <p>• <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Space</kbd> to pause / resume</p>
          </div>
        </div>
      </div>
    </div>
  );
};
