import React, { useEffect, useRef, useState } from "react";
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Heart,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

// 19 x 21 Maze Layout: 0: Pellet, 1: Wall, 2: Power Pellet, 3: Empty, 4: Ghost Spawn
const MAZE_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 4, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 3, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 3, 0, 3, 3, 1, 4, 4, 4, 1, 3, 3, 0, 3, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 2, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 2, 1],
  [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const COLS = 19;
const ROWS = 21;
const TILE_SIZE = 22;

interface Ghost {
  id: string;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  color: string;
  isFrightened: boolean;
  spawnX: number;
  spawnY: number;
}

function playSynth(freq: number, type: OscillatorType = "sine", duration = 0.06) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio restrictions
  }
}

export const PacMazeApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("pokie_pacmaze_high") || "0", 10);
  });
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player state
  const playerRef = useRef({
    x: 9 * TILE_SIZE,
    y: 16 * TILE_SIZE,
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0,
    mouthAngle: 0.2,
    mouthOpening: true,
    speed: 2.2,
  });

  // Maze grid state (remaining pellets)
  const mazeRef = useRef<number[][]>(MAZE_MAP.map((r) => [...r]));
  const frightenedTimerRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  // Ghosts
  const ghostsRef = useRef<Ghost[]>([
    { id: "blinky", x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, dirX: 1, dirY: 0, color: "#ef4444", isFrightened: false, spawnX: 9, spawnY: 8 },
    { id: "pinky", x: 9 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: -1, dirY: 0, color: "#f472b6", isFrightened: false, spawnX: 9, spawnY: 10 },
    { id: "inky", x: 8 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: 0, dirY: -1, color: "#06b6d4", isFrightened: false, spawnX: 8, spawnY: 10 },
    { id: "clyde", x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: 0, dirY: 1, color: "#f97316", isFrightened: false, spawnX: 10, spawnY: 10 },
  ]);

  // Reset Game
  const initGame = () => {
    mazeRef.current = MAZE_MAP.map((r) => [...r]);
    playerRef.current = {
      x: 9 * TILE_SIZE,
      y: 16 * TILE_SIZE,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      mouthAngle: 0.2,
      mouthOpening: true,
      speed: 2.2,
    };
    ghostsRef.current = [
      { id: "blinky", x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, dirX: 1, dirY: 0, color: "#ef4444", isFrightened: false, spawnX: 9, spawnY: 8 },
      { id: "pinky", x: 9 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: -1, dirY: 0, color: "#f472b6", isFrightened: false, spawnX: 9, spawnY: 10 },
      { id: "inky", x: 8 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: 0, dirY: -1, color: "#06b6d4", isFrightened: false, spawnX: 8, spawnY: 10 },
      { id: "clyde", x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, dirX: 0, dirY: 1, color: "#f97316", isFrightened: false, spawnX: 10, spawnY: 10 },
    ];
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    frightenedTimerRef.current = 0;
  };

  useEffect(() => {
    initGame();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "s", "a", "d", " "].includes(e.key)) {
        e.preventDefault();
      }
      const p = playerRef.current;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        p.nextDirX = -1;
        p.nextDirY = 0;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        p.nextDirX = 1;
        p.nextDirY = 0;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        p.nextDirX = 0;
        p.nextDirY = -1;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        p.nextDirX = 0;
        p.nextDirY = 1;
      }
      if (e.key === " " && (gameOver || gameWon)) {
        initGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, gameWon]);

  // Is tile walkable
  const isWalkable = (tileX: number, tileY: number): boolean => {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
      // Tunnel wrap allowed horizontally
      if (tileY === 10 && (tileX < 0 || tileX >= COLS)) return true;
      return false;
    }
    const tile = mazeRef.current[tileY]?.[tileX];
    return tile !== 1;
  };

  // Main 60fps Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (!gameOver && !gameWon) {
        const p = playerRef.current;

        // Frightened timer countdown
        if (frightenedTimerRef.current > 0) {
          frightenedTimerRef.current -= 1 / 60;
          if (frightenedTimerRef.current <= 0) {
            ghostsRef.current.forEach((g) => (g.isFrightened = false));
          }
        }

        // Try changing to desired next direction when centered in tile
        const currentTileX = Math.round(p.x / TILE_SIZE);
        const currentTileY = Math.round(p.y / TILE_SIZE);
        const isCenteredX = Math.abs(p.x - currentTileX * TILE_SIZE) < p.speed;
        const isCenteredY = Math.abs(p.y - currentTileY * TILE_SIZE) < p.speed;

        if (isCenteredX && isCenteredY) {
          if (isWalkable(currentTileX + p.nextDirX, currentTileY + p.nextDirY)) {
            p.dirX = p.nextDirX;
            p.dirY = p.nextDirY;
            p.x = currentTileX * TILE_SIZE;
            p.y = currentTileY * TILE_SIZE;
          }
        }

        // Move Player if path is clear
        const nextTileX = Math.floor((p.x + p.dirX * (TILE_SIZE / 2 + p.speed)) / TILE_SIZE);
        const nextTileY = Math.floor((p.y + p.dirY * (TILE_SIZE / 2 + p.speed)) / TILE_SIZE);

        if (isWalkable(nextTileX, nextTileY)) {
          p.x += p.dirX * p.speed;
          p.y += p.dirY * p.speed;
        }

        // Horizontal Tunnel Wrap
        if (p.x < -TILE_SIZE) p.x = (COLS - 1) * TILE_SIZE;
        if (p.x > (COLS - 1) * TILE_SIZE) p.x = -TILE_SIZE;

        // Animate mouth
        if (p.mouthOpening) {
          p.mouthAngle += 0.04;
          if (p.mouthAngle >= 0.45) p.mouthOpening = false;
        } else {
          p.mouthAngle -= 0.04;
          if (p.mouthAngle <= 0.05) p.mouthOpening = true;
        }

        // Eat Pellets
        const playerGridX = Math.round(p.x / TILE_SIZE);
        const playerGridY = Math.round(p.y / TILE_SIZE);
        if (playerGridY >= 0 && playerGridY < ROWS && playerGridX >= 0 && playerGridX < COLS) {
          const currentCell = mazeRef.current[playerGridY][playerGridX];
          if (currentCell === 0) {
            // Normal Pellet
            mazeRef.current[playerGridY][playerGridX] = 3;
            setScore((s) => {
              const next = s + 10;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem("pokie_pacmaze_high", next.toString());
              }
              return next;
            });
            if (soundEnabled) playSynth(480, "triangle", 0.03);
          } else if (currentCell === 2) {
            // Power Energizer Pellet
            mazeRef.current[playerGridY][playerGridX] = 3;
            setScore((s) => s + 50);
            frightenedTimerRef.current = 7; // 7 seconds
            ghostsRef.current.forEach((g) => (g.isFrightened = true));
            if (soundEnabled) playSynth(750, "sine", 0.15);
          }
        }

        // Check if all pellets cleared
        let remainingPellets = 0;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (mazeRef.current[r][c] === 0 || mazeRef.current[r][c] === 2) {
              remainingPellets++;
            }
          }
        }

        if (remainingPellets === 0) {
          setGameWon(true);
          confetti({ particleCount: 60, spread: 60 });
          if (soundEnabled) playSynth(600, "square", 0.3);
        }

        // Move Ghosts AI
        for (const ghost of ghostsRef.current) {
          const gTileX = Math.round(ghost.x / TILE_SIZE);
          const gTileY = Math.round(ghost.y / TILE_SIZE);
          const isGCentered =
            Math.abs(ghost.x - gTileX * TILE_SIZE) < 1.5 && Math.abs(ghost.y - gTileY * TILE_SIZE) < 1.5;

          if (isGCentered) {
            // Pick possible directions that are not reversing
            const possibleDirs: { dx: number; dy: number }[] = [];
            const dirs = [
              { dx: 1, dy: 0 },
              { dx: -1, dy: 0 },
              { dx: 0, dy: 1 },
              { dx: 0, dy: -1 },
            ];

            for (const d of dirs) {
              // Avoid exact 180 reverse unless trapped
              if (d.dx === -ghost.dirX && d.dy === -ghost.dirY) continue;
              if (isWalkable(gTileX + d.dx, gTileY + d.dy)) {
                possibleDirs.push(d);
              }
            }

            if (possibleDirs.length > 0) {
              // If chasing, pick direction minimizing distance to player
              if (!ghost.isFrightened && Math.random() < 0.75) {
                possibleDirs.sort((a, b) => {
                  const distA = Math.hypot(gTileX + a.dx - playerGridX, gTileY + a.dy - playerGridY);
                  const distB = Math.hypot(gTileX + b.dx - playerGridX, gTileY + b.dy - playerGridY);
                  return distA - distB;
                });
                ghost.dirX = possibleDirs[0].dx;
                ghost.dirY = possibleDirs[0].dy;
              } else {
                // Random turn
                const chosen = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                ghost.dirX = chosen.dx;
                ghost.dirY = chosen.dy;
              }
            } else if (isWalkable(gTileX - ghost.dirX, gTileY - ghost.dirY)) {
              ghost.dirX = -ghost.dirX;
              ghost.dirY = -ghost.dirY;
            }
          }

          const gSpeed = ghost.isFrightened ? 1.2 : 1.8;
          ghost.x += ghost.dirX * gSpeed;
          ghost.y += ghost.dirY * gSpeed;

          // Check Collision with Pacman
          const distToPlayer = Math.hypot(ghost.x - p.x, ghost.y - p.y);
          if (distToPlayer < TILE_SIZE * 0.8) {
            if (ghost.isFrightened) {
              // Eat Ghost!
              ghost.x = ghost.spawnX * TILE_SIZE;
              ghost.y = ghost.spawnY * TILE_SIZE;
              ghost.isFrightened = false;
              setScore((s) => s + 200);
              if (soundEnabled) playSynth(880, "sawtooth", 0.2);
            } else {
              // Pacman caught!
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setGameOver(true);
                  if (soundEnabled) playSynth(160, "sawtooth", 0.4);
                } else {
                  // Reset positions
                  p.x = 9 * TILE_SIZE;
                  p.y = 16 * TILE_SIZE;
                  p.dirX = 0;
                  p.dirY = 0;
                  if (soundEnabled) playSynth(220, "triangle", 0.2);
                }
                return nextLives;
              });
            }
          }
        }
      }

      // ================= DRAWING =================
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Dark Retro Maze Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, W, H);

      // Draw Maze Walls & Pellets
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = mazeRef.current[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (cell === 1) {
            // Neon Blue Wall
            ctx.fillStyle = "#1e3a8a";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          } else if (cell === 0) {
            // Small Pellet
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 2) {
            // Big Power Energizer Pellet (Pulsing)
            const pulse = (Math.sin(Date.now() * 0.008) + 1) * 2;
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5.5 + pulse, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Pac-Man
      const p = playerRef.current;
      let rot = 0;
      if (p.dirX === 1) rot = 0;
      else if (p.dirX === -1) rot = Math.PI;
      else if (p.dirY === 1) rot = Math.PI / 2;
      else if (p.dirY === -1) rot = (Math.PI * 3) / 2;

      ctx.fillStyle = "#eab308"; // Bright yellow
      ctx.beginPath();
      ctx.arc(
        p.x + TILE_SIZE / 2,
        p.y + TILE_SIZE / 2,
        TILE_SIZE / 2 - 1,
        rot + p.mouthAngle,
        rot + Math.PI * 2 - p.mouthAngle
      );
      ctx.lineTo(p.x + TILE_SIZE / 2, p.y + TILE_SIZE / 2);
      ctx.fill();

      // Draw Ghosts
      for (const ghost of ghostsRef.current) {
        const gx = ghost.x + TILE_SIZE / 2;
        const gy = ghost.y + TILE_SIZE / 2;

        ctx.fillStyle = ghost.isFrightened
          ? frightenedTimerRef.current < 2 && Math.floor(Date.now() / 150) % 2 === 0
            ? "#ffffff"
            : "#2563eb"
          : ghost.color;

        // Ghost Body Dome
        ctx.beginPath();
        ctx.arc(gx, gy - 2, TILE_SIZE / 2 - 2, Math.PI, 0, false);
        ctx.lineTo(gx + TILE_SIZE / 2 - 2, gy + TILE_SIZE / 2 - 2);
        // Wavy bottom skirt
        ctx.lineTo(gx + 4, gy + TILE_SIZE / 2 - 5);
        ctx.lineTo(gx, gy + TILE_SIZE / 2 - 2);
        ctx.lineTo(gx - 4, gy + TILE_SIZE / 2 - 5);
        ctx.lineTo(gx - TILE_SIZE / 2 + 2, gy + TILE_SIZE / 2 - 2);
        ctx.closePath();
        ctx.fill();

        // Ghost Eyes
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gx - 4 + ghost.dirX * 2, gy - 3 + ghost.dirY * 2, 3, 0, Math.PI * 2);
        ctx.arc(gx + 4 + ghost.dirX * 2, gy - 3 + ghost.dirY * 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye Pupils
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(gx - 4 + ghost.dirX * 3, gy - 3 + ghost.dirY * 3, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 4 + ghost.dirX * 3, gy - 3 + ghost.dirY * 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver, gameWon, soundEnabled, highScore]);

  // Touch handlers
  const setDirection = (dx: number, dy: number) => {
    playerRef.current.nextDirX = dx;
    playerRef.current.nextDirY = dy;
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-sm">
            ᗧ
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Pac-Maze Arcade</h2>
            <p className="text-xs text-slate-400">Classic Maze Runner</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Lives */}
          <div className="flex items-center gap-1 text-red-400">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? "fill-red-500 text-red-500" : "text-slate-700"}`}
              />
            ))}
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

      {/* Main Maze Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-blue-950 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
          className="block w-full max-w-[418px] aspect-[19/21]"
        />

        {/* Live Score Floating Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 px-3 py-1 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
          <p className="text-lg font-black text-yellow-400 font-mono leading-none mt-0.5">{score}</p>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-4xl mb-2">👻</span>
            <h3 className="text-2xl font-black text-white">Caught by Ghosts!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Final Score: {score}</p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-yellow-500/20 transition active:scale-95"
            >
              Play Again (Space)
            </button>
          </div>
        )}

        {/* Victory Screen */}
        {gameWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <Sparkles className="w-12 h-12 text-yellow-400 mb-2" />
            <h3 className="text-2xl font-black text-white">Maze Cleared!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">You ate all pellets! Final Score: {score}</p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-yellow-500/20 transition active:scale-95"
            >
              Play Next Level
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-5 grid grid-cols-3 gap-2 w-48">
        <div />
        <button
          onClick={() => setDirection(0, -1)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />
        <button
          onClick={() => setDirection(-1, 0)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setDirection(0, 1)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button
          onClick={() => setDirection(1, 0)}
          className="aspect-square rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Use Arrow Keys or WASD. Eat big pellets to turn ghosts blue and chomp them for 200 pts!
      </p>
    </div>
  );
};
