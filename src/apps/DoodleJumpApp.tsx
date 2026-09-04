import React, { useEffect, useRef, useState } from "react";
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "normal" | "moving" | "spring" | "broken";
  vx?: number;
  brokenState?: boolean;
}

interface Item {
  x: number;
  y: number;
  type: "spring" | "star" | "jetpack";
  collected?: boolean;
}

function playJumpTone(freq: number, type: OscillatorType = "sine", duration = 0.1) {
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
    // Ignore audio errors
  }
}

export const DoodleJumpApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("pokie_doodle_high") || "0", 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player physics ref
  const playerRef = useRef({
    x: 180,
    y: 400,
    width: 32,
    height: 32,
    vx: 0,
    vy: -10,
    facing: 1 as 1 | -1,
  });

  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const platformsRef = useRef<Platform[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const cameraYRef = useRef(0);
  const maxAltitudeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const CANVAS_WIDTH = 380;
  const CANVAS_HEIGHT = 560;

  // Initialize Game
  const initGame = () => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 16,
      y: 400,
      width: 32,
      height: 32,
      vx: 0,
      vy: -12,
      facing: 1,
    };
    cameraYRef.current = 0;
    maxAltitudeRef.current = 0;
    setScore(0);
    setGameOver(false);

    // Initial platforms
    const initialPlatforms: Platform[] = [
      { x: CANVAS_WIDTH / 2 - 35, y: 460, width: 70, height: 14, type: "normal" },
      { x: 100, y: 360, width: 70, height: 14, type: "normal" },
      { x: 240, y: 270, width: 70, height: 14, type: "spring" },
      { x: 80, y: 180, width: 70, height: 14, type: "moving", vx: 2 },
      { x: 200, y: 90, width: 70, height: 14, type: "normal" },
    ];

    // Generate higher platforms up to -2000
    let curY = 0;
    while (curY > -2000) {
      curY -= Math.floor(Math.random() * 45 + 45);
      const rand = Math.random();
      let type: Platform["type"] = "normal";
      if (rand < 0.2) type = "moving";
      else if (rand < 0.35) type = "spring";
      else if (rand < 0.45) type = "broken";

      initialPlatforms.push({
        x: Math.random() * (CANVAS_WIDTH - 80),
        y: curY,
        width: 70,
        height: 14,
        type,
        vx: type === "moving" ? (Math.random() > 0.5 ? 2 : -2) : undefined,
      });

      // Bonus star
      if (Math.random() < 0.2) {
        itemsRef.current.push({
          x: Math.random() * (CANVAS_WIDTH - 30) + 15,
          y: curY - 24,
          type: "star",
        });
      }
    }

    platformsRef.current = initialPlatforms;
  };

  useEffect(() => {
    initGame();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysRef.current.left = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysRef.current.right = true;
      }
      if (e.key === " " && gameOver) {
        initGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysRef.current.left = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver]);

  // Main 60 FPS Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const p = playerRef.current;

      if (!gameOver) {
        // Horizontal Movement
        if (keysRef.current.left) {
          p.vx = -6.5;
          p.facing = -1;
        } else if (keysRef.current.right) {
          p.vx = 6.5;
          p.facing = 1;
        } else {
          p.vx *= 0.82; // friction
        }

        p.x += p.vx;

        // Screen wrap
        if (p.x < -p.width) p.x = CANVAS_WIDTH;
        if (p.x > CANVAS_WIDTH) p.x = -p.width;

        // Vertical Gravity Physics
        p.vy += 0.38; // gravity
        p.y += p.vy;

        // Platform Collisions (only when falling downwards)
        if (p.vy > 0) {
          for (const plat of platformsRef.current) {
            if (plat.brokenState) continue;

            const playerBottom = p.y + p.height;
            const prevPlayerBottom = playerBottom - p.vy;

            if (
              p.x + p.width - 6 >= plat.x &&
              p.x + 6 <= plat.x + plat.width &&
              prevPlayerBottom <= plat.y + 4 &&
              playerBottom >= plat.y
            ) {
              if (plat.type === "broken") {
                plat.brokenState = true;
                if (soundEnabled) playJumpTone(200, "sawtooth", 0.15);
              } else if (plat.type === "spring") {
                p.vy = -18.5; // Super spring bounce
                if (soundEnabled) playJumpTone(850, "sine", 0.2);
                confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
              } else {
                p.vy = -12; // Normal bounce
                if (soundEnabled) playJumpTone(480, "sine", 0.08);
              }
              break;
            }
          }
        }

        // Star pickups
        for (const item of itemsRef.current) {
          if (!item.collected) {
            if (
              Math.abs(p.x + p.width / 2 - item.x) < 24 &&
              Math.abs(p.y + p.height / 2 - item.y) < 24
            ) {
              item.collected = true;
              maxAltitudeRef.current += 100;
              setScore((s) => s + 100);
              if (soundEnabled) playJumpTone(950, "triangle", 0.15);
            }
          }
        }

        // Camera Scroll tracking
        const targetCamY = p.y - CANVAS_HEIGHT / 2;
        if (targetCamY < cameraYRef.current) {
          cameraYRef.current += (targetCamY - cameraYRef.current) * 0.15;
          const currentAlt = Math.floor(-cameraYRef.current);
          if (currentAlt > maxAltitudeRef.current) {
            maxAltitudeRef.current = currentAlt;
            setScore(currentAlt);
            if (currentAlt > highScore) {
              setHighScore(currentAlt);
              localStorage.setItem("pokie_doodle_high", currentAlt.toString());
            }
          }
        }

        // Update Moving platforms
        for (const plat of platformsRef.current) {
          if (plat.type === "moving" && plat.vx) {
            plat.x += plat.vx;
            if (plat.x < 0 || plat.x + plat.width > CANVAS_WIDTH) {
              plat.vx *= -1;
            }
          }
        }

        // Procedurally generate platforms above
        const highestPlatform = Math.min(...platformsRef.current.map((p) => p.y));
        if (highestPlatform > cameraYRef.current - 600) {
          let genY = highestPlatform;
          for (let i = 0; i < 8; i++) {
            genY -= Math.floor(Math.random() * 50 + 50);
            const rand = Math.random();
            let type: Platform["type"] = "normal";
            if (rand < 0.25) type = "moving";
            else if (rand < 0.4) type = "spring";
            else if (rand < 0.55) type = "broken";

            platformsRef.current.push({
              x: Math.random() * (CANVAS_WIDTH - 80),
              y: genY,
              width: 70,
              height: 14,
              type,
              vx: type === "moving" ? (Math.random() > 0.5 ? 2.2 : -2.2) : undefined,
            });

            if (Math.random() < 0.25) {
              itemsRef.current.push({
                x: Math.random() * (CANVAS_WIDTH - 30) + 15,
                y: genY - 24,
                type: "star",
              });
            }
          }
        }

        // Clean up old platforms below camera
        platformsRef.current = platformsRef.current.filter(
          (plat) => plat.y < cameraYRef.current + CANVAS_HEIGHT + 150
        );

        // Check Fall Game Over
        if (p.y > cameraYRef.current + CANVAS_HEIGHT + 50) {
          setGameOver(true);
          if (soundEnabled) playJumpTone(140, "sawtooth", 0.4);
        }
      }

      // ================= DRAWING =================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cute Grid Paper Background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      const gridShiftY = Math.floor(cameraYRef.current) % 30;
      for (let y = -gridShiftY; y < CANVAS_HEIGHT; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      for (let x = 0; x < CANVAS_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw Platforms
      for (const plat of platformsRef.current) {
        const screenY = plat.y - cameraYRef.current;
        if (screenY < -20 || screenY > CANVAS_HEIGHT + 20) continue;

        if (plat.type === "normal") {
          ctx.fillStyle = "#22c55e"; // Green
          ctx.beginPath();
          ctx.roundRect(plat.x, screenY, plat.width, plat.height, 6);
          ctx.fill();
        } else if (plat.type === "moving") {
          ctx.fillStyle = "#3b82f6"; // Blue
          ctx.beginPath();
          ctx.roundRect(plat.x, screenY, plat.width, plat.height, 6);
          ctx.fill();
        } else if (plat.type === "spring") {
          ctx.fillStyle = "#a855f7"; // Purple with spring icon
          ctx.beginPath();
          ctx.roundRect(plat.x, screenY, plat.width, plat.height, 6);
          ctx.fill();

          // Spring coiled coils
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(plat.x + plat.width / 2 - 8, screenY - 8, 16, 8);
        } else if (plat.type === "broken") {
          if (!plat.brokenState) {
            ctx.fillStyle = "#94a3b8"; // Brown/Grey cracked
            ctx.beginPath();
            ctx.roundRect(plat.x, screenY, plat.width, plat.height, 4);
            ctx.fill();
            // Crack line
            ctx.strokeStyle = "#334155";
            ctx.beginPath();
            ctx.moveTo(plat.x + 30, screenY);
            ctx.lineTo(plat.x + 40, screenY + plat.height);
            ctx.stroke();
          }
        }
      }

      // Draw Items (Stars)
      for (const item of itemsRef.current) {
        if (item.collected) continue;
        const screenY = item.y - cameraYRef.current;
        if (screenY < -20 || screenY > CANVAS_HEIGHT + 20) continue;

        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(item.x, screenY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(item.x, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Doodle Character (Little Alien / Jumper)
      const screenY = p.y - cameraYRef.current;

      // Character Body (Bright Yellow-Green Doodler)
      ctx.fillStyle = "#84cc16";
      ctx.beginPath();
      ctx.roundRect(p.x, screenY, p.width, p.height, 12);
      ctx.fill();

      // Snout / Nose
      ctx.fillStyle = "#65a30d";
      if (p.facing === 1) {
        ctx.beginPath();
        ctx.roundRect(p.x + p.width - 4, screenY + 12, 12, 8, 4);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(p.x + 20, screenY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(p.x - 8, screenY + 12, 12, 8, 4);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(p.x + 12, screenY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Little Legs
      ctx.fillStyle = "#4d7c0f";
      ctx.fillRect(p.x + 6, screenY + p.height, 6, 4);
      ctx.fillRect(p.x + p.width - 12, screenY + p.height, 6, 4);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver, soundEnabled]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-lime-500 to-emerald-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
            🦘
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Doodle Sky Hopper</h2>
            <p className="text-xs text-slate-400">Vertical Platform Jumper</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-100">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full max-w-[380px] h-[560px]"
        />

        {/* Altitude Score */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 px-3.5 py-1.5 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Altitude</span>
          <p className="text-xl font-black text-white font-mono leading-none mt-0.5">{score}m</p>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-4xl mb-2">🚀</span>
            <h3 className="text-2xl font-black text-white">Fell Down!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-1">Max Altitude: {score}m</p>
            {score >= highScore && score > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs mb-4">
                <Sparkles className="w-3.5 h-3.5" /> New High Altitude!
              </span>
            )}
            <button
              onClick={initGame}
              className="mt-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              Jump Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Touch Left / Right Controls */}
      <div className="w-full max-w-[380px] mt-4 grid grid-cols-2 gap-3 px-2">
        <button
          onPointerDown={() => (keysRef.current.left = true)}
          onPointerUp={() => (keysRef.current.left = false)}
          onPointerLeave={() => (keysRef.current.left = false)}
          className="py-4 rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center gap-2 font-bold text-sm border border-slate-700 shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Move Left</span>
        </button>
        <button
          onPointerDown={() => (keysRef.current.right = true)}
          onPointerUp={() => (keysRef.current.right = false)}
          onPointerLeave={() => (keysRef.current.right = false)}
          className="py-4 rounded-2xl bg-slate-800 active:bg-slate-700 text-white flex items-center justify-center gap-2 font-bold text-sm border border-slate-700 shadow-sm transition active:scale-95"
        >
          <span>Move Right</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Use ◀ Left / Right ▶ arrow keys or A/D. Bounce on purple springs for massive rocket jumps!
      </p>
    </div>
  );
};
