import React, { useEffect, useRef, useState } from "react";
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Coins,
} from "lucide-react";
import confetti from "canvas-confetti";

// Lane types
type LaneType = "grass" | "road" | "river" | "train";

interface Vehicle {
  x: number;
  width: number;
  speed: number;
  color: string;
}

interface Log {
  x: number;
  width: number;
  speed: number;
}

interface Lane {
  id: number;
  y: number; // Row index
  type: LaneType;
  speed: number;
  direction: 1 | -1;
  vehicles?: Vehicle[];
  logs?: Log[];
  trainWarning?: number; // >0 countdown to train
  trainActive?: boolean;
  trainX?: number;
  coins?: number[]; // X indices
}

// Sound synthesizer
function playBeep(freq: number, type: OscillatorType = "sine", duration = 0.08) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio restrictions
  }
}

export const CrossyRoadApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [coinsCount, setCoinsCount] = useState(() => {
    return parseInt(localStorage.getItem("pokie_crossy_coins") || "0", 10);
  });
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("pokie_crossy_high") || "0", 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player State
  const playerRef = useRef({
    col: 4, // 0..8
    row: 0, // distance moved up
    realY: 0, // for smooth camera & jump interpolation
    jumpProgress: 1, // 0..1
    prevCol: 4,
    prevRow: 0,
    dead: false,
  });

  const lanesRef = useRef<Lane[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const maxRowReachedRef = useRef(0);

  const GRID_COLS = 9;
  const CELL_SIZE = 48; // Canvas logical grid size

  // Generate lane
  const generateLane = (row: number): Lane => {
    // Initial safe rows
    if (row <= 2) {
      return { id: row, y: row, type: "grass", speed: 0, direction: 1 };
    }

    const rand = Math.random();
    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const speed = 1.2 + Math.random() * 2.2 + Math.min(row * 0.03, 2.5);

    // Coins on lane
    const coins: number[] = [];
    if (Math.random() < 0.25) {
      coins.push(Math.floor(Math.random() * GRID_COLS));
    }

    if (rand < 0.3) {
      return { id: row, y: row, type: "grass", speed: 0, direction: 1, coins };
    } else if (rand < 0.65) {
      // Road
      const carCount = Math.floor(Math.random() * 2) + 2;
      const vehicles: Vehicle[] = [];
      const carColors = ["#ef4444", "#3b82f6", "#eab308", "#8b5cf6", "#f97316"];
      for (let i = 0; i < carCount; i++) {
        vehicles.push({
          x: (i * (GRID_COLS / carCount) + Math.random() * 0.5) * CELL_SIZE,
          width: Math.random() > 0.6 ? CELL_SIZE * 1.8 : CELL_SIZE * 1.2, // car or truck
          speed: speed * dir,
          color: carColors[Math.floor(Math.random() * carColors.length)],
        });
      }
      return { id: row, y: row, type: "road", speed, direction: dir, vehicles, coins };
    } else if (rand < 0.88) {
      // River
      const logCount = Math.floor(Math.random() * 2) + 2;
      const logs: Log[] = [];
      for (let i = 0; i < logCount; i++) {
        logs.push({
          x: (i * (GRID_COLS / logCount) + Math.random() * 0.5) * CELL_SIZE,
          width: CELL_SIZE * (1.8 + Math.random() * 1.2),
          speed: speed * 0.8 * dir,
        });
      }
      return { id: row, y: row, type: "river", speed: speed * 0.8, direction: dir, logs, coins };
    } else {
      // Train track
      return {
        id: row,
        y: row,
        type: "train",
        speed: 12, // fast bullet train
        direction: dir,
        trainWarning: Math.random() * 3 + 2,
        trainActive: false,
        trainX: dir === 1 ? -CELL_SIZE * 8 : (GRID_COLS + 8) * CELL_SIZE,
        coins,
      };
    }
  };

  // Initialize lanes
  const initGame = () => {
    playerRef.current = {
      col: 4,
      row: 0,
      realY: 0,
      jumpProgress: 1,
      prevCol: 4,
      prevRow: 0,
      dead: false,
    };
    maxRowReachedRef.current = 0;
    setScore(0);
    setGameOver(false);

    const initialLanes: Lane[] = [];
    for (let r = 0; r < 25; r++) {
      initialLanes.push(generateLane(r));
    }
    lanesRef.current = initialLanes;
  };

  useEffect(() => {
    initGame();
  }, []);

  // Player Movement Handler
  const movePlayer = (dCol: number, dRow: number) => {
    if (playerRef.current.dead || gameOver) return;

    const p = playerRef.current;
    const newCol = Math.max(0, Math.min(GRID_COLS - 1, p.col + dCol));
    const newRow = Math.max(0, p.row + dRow);

    if (newCol === p.col && newRow === p.row) return;

    p.prevCol = p.col;
    p.prevRow = p.row;
    p.col = newCol;
    p.row = newRow;
    p.jumpProgress = 0;

    if (soundEnabled) {
      playBeep(420 + dRow * 40, "sine", 0.06);
    }

    if (newRow > maxRowReachedRef.current) {
      maxRowReachedRef.current = newRow;
      setScore(newRow);
      if (newRow > highScore) {
        setHighScore(newRow);
        localStorage.setItem("pokie_crossy_high", newRow.toString());
      }
    }

    // Ensure lanes ahead are generated
    while (lanesRef.current.length < newRow + 20) {
      const nextR = lanesRef.current.length;
      lanesRef.current.push(generateLane(nextR));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "s", "a", "d", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") movePlayer(0, 1);
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") movePlayer(0, -1);
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") movePlayer(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") movePlayer(1, 0);
      if (e.key === " " && gameOver) initGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, soundEnabled, highScore]);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const p = playerRef.current;

      // Jump animation progress
      if (p.jumpProgress < 1) {
        p.jumpProgress = Math.min(1, p.jumpProgress + dt * 10);
      }

      // Update Lanes (Vehicles, Trains, Logs)
      const totalWidth = GRID_COLS * CELL_SIZE;

      for (const lane of lanesRef.current) {
        if (lane.type === "road" && lane.vehicles) {
          for (const v of lane.vehicles) {
            v.x += v.speed * (dt * 60);
            if (v.speed > 0 && v.x > totalWidth + CELL_SIZE) {
              v.x = -v.width;
            } else if (v.speed < 0 && v.x < -v.width) {
              v.x = totalWidth + CELL_SIZE;
            }
          }
        } else if (lane.type === "river" && lane.logs) {
          for (const l of lane.logs) {
            l.x += l.speed * (dt * 60);
            if (l.speed > 0 && l.x > totalWidth + CELL_SIZE) {
              l.x = -l.width;
            } else if (l.speed < 0 && l.x < -l.width) {
              l.x = totalWidth + CELL_SIZE;
            }
          }
        } else if (lane.type === "train") {
          if (lane.trainWarning !== undefined && !lane.trainActive) {
            lane.trainWarning -= dt;
            if (lane.trainWarning <= 0) {
              lane.trainActive = true;
              lane.trainWarning = 4 + Math.random() * 4; // reset next timer
              lane.trainX = lane.direction === 1 ? -CELL_SIZE * 10 : totalWidth + CELL_SIZE * 10;
              if (soundEnabled && Math.abs(p.row - lane.y) <= 4) {
                playBeep(220, "sawtooth", 0.3);
              }
            }
          } else if (lane.trainActive && lane.trainX !== undefined) {
            lane.trainX += lane.speed * lane.direction * (dt * 60);
            if (lane.direction === 1 && lane.trainX > totalWidth + CELL_SIZE * 12) {
              lane.trainActive = false;
            } else if (lane.direction === -1 && lane.trainX < -CELL_SIZE * 12) {
              lane.trainActive = false;
            }
          }
        }
      }

      // Check Coin pickups
      const currentLane = lanesRef.current.find((l) => l.y === p.row);
      if (currentLane && currentLane.coins && currentLane.coins.includes(p.col)) {
        currentLane.coins = currentLane.coins.filter((c) => c !== p.col);
        setCoinsCount((c) => {
          const next = c + 1;
          localStorage.setItem("pokie_crossy_coins", next.toString());
          return next;
        });
        if (soundEnabled) playBeep(880, "sine", 0.1);
      }

      // Check Player physics & Collisions on settled lane
      if (p.jumpProgress >= 0.8 && !p.dead) {
        if (currentLane) {
          const playerPx = p.col * CELL_SIZE + CELL_SIZE / 2;

          // Road collision
          if (currentLane.type === "road" && currentLane.vehicles) {
            for (const v of currentLane.vehicles) {
              if (playerPx > v.x + 6 && playerPx < v.x + v.width - 6) {
                // Squished by car
                p.dead = true;
                setGameOver(true);
                if (soundEnabled) playBeep(120, "sawtooth", 0.4);
              }
            }
          }
          // Train collision
          else if (currentLane.type === "train" && currentLane.trainActive && currentLane.trainX !== undefined) {
            const trainW = CELL_SIZE * 8;
            const tMin = currentLane.direction === 1 ? currentLane.trainX : currentLane.trainX - trainW;
            const tMax = tMin + trainW;
            if (playerPx > tMin && playerPx < tMax) {
              p.dead = true;
              setGameOver(true);
              if (soundEnabled) playBeep(90, "sawtooth", 0.5);
            }
          }
          // River mechanics (must be on a log)
          else if (currentLane.type === "river" && currentLane.logs) {
            let onLog = false;
            let logSpeed = 0;
            for (const l of currentLane.logs) {
              if (playerPx >= l.x && playerPx <= l.x + l.width) {
                onLog = true;
                logSpeed = l.speed;
                break;
              }
            }

            if (onLog) {
              // Drift with log
              const driftCol = (playerPx + logSpeed * (dt * 60) - CELL_SIZE / 2) / CELL_SIZE;
              p.col = Math.max(0, Math.min(GRID_COLS - 1, Math.round(driftCol)));
            } else {
              // Drowned in river!
              p.dead = true;
              setGameOver(true);
              if (soundEnabled) playBeep(180, "triangle", 0.35);
            }
          }
        }
      }

      // ================= DRAWING (CANVAS) =================
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Camera view: Center on player vertically
      const cameraY = (p.row - 3) * CELL_SIZE;

      // Draw Lanes
      for (const lane of lanesRef.current) {
        const laneScreenY = H - (lane.y * CELL_SIZE - cameraY) - CELL_SIZE;
        if (laneScreenY < -CELL_SIZE * 2 || laneScreenY > H + CELL_SIZE) continue;

        // Lane Background
        if (lane.type === "grass") {
          ctx.fillStyle = lane.y % 2 === 0 ? "#15803d" : "#16a34a"; // Lush green
          ctx.fillRect(0, laneScreenY, W, CELL_SIZE);
          // Grass tuft accents
          ctx.fillStyle = "#22c55e";
          for (let i = 1; i < GRID_COLS; i += 2) {
            ctx.fillRect(i * CELL_SIZE + 10, laneScreenY + 12, 6, 4);
          }
        } else if (lane.type === "road") {
          ctx.fillStyle = "#334155"; // Asphalt
          ctx.fillRect(0, laneScreenY, W, CELL_SIZE);
          // White dashed center line
          ctx.strokeStyle = "#94a3b8";
          ctx.setLineDash([12, 12]);
          ctx.beginPath();
          ctx.moveTo(0, laneScreenY + CELL_SIZE / 2);
          ctx.lineTo(W, laneScreenY + CELL_SIZE / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (lane.type === "river") {
          ctx.fillStyle = "#0284c7"; // Blue water
          ctx.fillRect(0, laneScreenY, W, CELL_SIZE);
          // Subtle wave ripples
          ctx.fillStyle = "#38bdf8";
          const waveShift = ((time * 0.05) % 40);
          for (let i = -40; i < W + 40; i += 40) {
            ctx.fillRect(i + waveShift, laneScreenY + 18, 16, 2);
          }
        } else if (lane.type === "train") {
          ctx.fillStyle = "#475569"; // Ballast gravel
          ctx.fillRect(0, laneScreenY, W, CELL_SIZE);
          // Rails
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(0, laneScreenY + 10, W, 4);
          ctx.fillRect(0, laneScreenY + CELL_SIZE - 14, W, 4);
          // Sleepers
          ctx.fillStyle = "#78350f";
          for (let i = 0; i < W; i += 24) {
            ctx.fillRect(i, laneScreenY + 6, 8, CELL_SIZE - 12);
          }

          // Train Red Signal Flasher
          if (lane.trainWarning !== undefined && lane.trainWarning <= 1.5) {
            const blink = Math.floor(time / 150) % 2 === 0;
            ctx.fillStyle = blink ? "#ef4444" : "#991b1b";
            ctx.beginPath();
            ctx.arc(W - 20, laneScreenY + CELL_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw Logs in River
        if (lane.type === "river" && lane.logs) {
          for (const log of lane.logs) {
            ctx.fillStyle = "#78350f"; // Wood brown
            ctx.beginPath();
            ctx.roundRect(log.x, laneScreenY + 6, log.width, CELL_SIZE - 12, 8);
            ctx.fill();
            // Bark texture
            ctx.fillStyle = "#92400e";
            ctx.fillRect(log.x + 8, laneScreenY + 14, log.width - 16, 3);
          }
        }

        // Draw Vehicles on Road
        if (lane.type === "road" && lane.vehicles) {
          for (const v of lane.vehicles) {
            ctx.fillStyle = v.color;
            ctx.beginPath();
            ctx.roundRect(v.x, laneScreenY + 8, v.width, CELL_SIZE - 16, 6);
            ctx.fill();

            // Windshield & lights
            ctx.fillStyle = "#e2e8f0";
            const wsX = v.speed > 0 ? v.x + v.width - 14 : v.x + 4;
            ctx.fillRect(wsX, laneScreenY + 12, 10, CELL_SIZE - 24);

            // Headlights
            ctx.fillStyle = "#fef08a";
            const hlX = v.speed > 0 ? v.x + v.width - 2 : v.x;
            ctx.fillRect(hlX, laneScreenY + 10, 2, 4);
            ctx.fillRect(hlX, laneScreenY + CELL_SIZE - 14, 2, 4);
          }
        }

        // Draw Train
        if (lane.type === "train" && lane.trainActive && lane.trainX !== undefined) {
          const tWidth = CELL_SIZE * 8;
          ctx.fillStyle = "#dc2626"; // Red bullet train
          ctx.beginPath();
          ctx.roundRect(lane.trainX, laneScreenY + 4, tWidth, CELL_SIZE - 8, 8);
          ctx.fill();

          // Train Windows
          ctx.fillStyle = "#38bdf8";
          for (let w = 16; w < tWidth - 16; w += 28) {
            ctx.fillRect(lane.trainX + w, laneScreenY + 12, 18, CELL_SIZE - 24);
          }
        }

        // Draw Coins
        if (lane.coins) {
          for (const coinCol of lane.coins) {
            const cx = coinCol * CELL_SIZE + CELL_SIZE / 2;
            const cy = laneScreenY + CELL_SIZE / 2;
            ctx.fillStyle = "#eab308"; // Golden coin
            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Player (Chicken / Hopper Character)
      const curCol = p.prevCol + (p.col - p.prevCol) * p.jumpProgress;
      const curRow = p.prevRow + (p.row - p.prevRow) * p.jumpProgress;
      const jumpArc = Math.sin(p.jumpProgress * Math.PI) * 16; // Bounce height

      const playerScreenX = curCol * CELL_SIZE + CELL_SIZE / 2;
      const playerScreenY = H - (curRow * CELL_SIZE - cameraY) - CELL_SIZE / 2 - jumpArc;

      if (!p.dead) {
        // Shadow underneath
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(
          playerScreenX,
          playerScreenY + jumpArc + 12,
          14 - jumpArc * 0.3,
          7 - jumpArc * 0.15,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Chicken Body
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(playerScreenX - 14, playerScreenY - 14, 28, 28, 7);
        ctx.fill();

        // Red Comb
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(playerScreenX - 5, playerScreenY - 20, 10, 6);

        // Yellow Beak
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(playerScreenX - 4, playerScreenY - 2);
        ctx.lineTo(playerScreenX + 4, playerScreenY - 2);
        ctx.lineTo(playerScreenX, playerScreenY + 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(playerScreenX - 8, playerScreenY - 8, 3, 3);
        ctx.fillRect(playerScreenX + 5, playerScreenY - 8, 3, 3);
      } else {
        // Splat / flattened
        ctx.fillStyle = "#f87171";
        ctx.beginPath();
        ctx.ellipse(playerScreenX, playerScreenY + 12, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [soundEnabled]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      {/* Top Status Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
            🐔
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Voxel Hopper</h2>
            <p className="text-xs text-slate-400">Cross the Busy World</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Coins className="w-4 h-4" />
            <span>{coinsCount}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300 font-bold text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Best: {highScore}</span>
          </div>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={GRID_COLS * CELL_SIZE}
          height={520}
          className="block w-full max-w-[432px] h-[520px]"
        />

        {/* Live Score Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 px-3.5 py-1.5 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distance</span>
          <p className="text-xl font-black text-white font-mono leading-none mt-0.5">{score}</p>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-4xl mb-2">💥</span>
            <h3 className="text-2xl font-black text-white">Splat! Game Over</h3>
            <p className="text-xs text-slate-400 mt-1 mb-1">You crossed {score} rows</p>
            {score >= highScore && score > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs mb-4">
                <Sparkles className="w-3.5 h-3.5" /> New High Score!
              </span>
            )}
            <button
              onClick={initGame}
              className="mt-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              Play Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-Pad Controls */}
      <div className="mt-5 grid grid-cols-3 gap-2 w-48">
        <div />
        <button
          onClick={() => movePlayer(0, 1)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />
        <button
          onClick={() => movePlayer(-1, 0)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => movePlayer(0, -1)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button
          onClick={() => movePlayer(1, 0)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Use Arrow Keys or WASD to hop. Avoid cars and trains, and ride river logs!
      </p>
    </div>
  );
};
