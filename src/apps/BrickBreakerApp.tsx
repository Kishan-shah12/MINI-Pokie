import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Zap,
  Sparkles,
  Flame,
  Shield,
  Heart,
  Maximize2,
} from "lucide-react";

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  color: string;
  isBomb?: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  isFireball?: boolean;
}

interface Powerup {
  x: number;
  y: number;
  type: "multiball" | "wide" | "laser" | "slow" | "fireball" | "life";
  dy: number;
  radius: number;
}

interface Laser {
  x: number;
  y: number;
  dy: number;
}

export const BrickBreakerApp: React.FC = () => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<"ready" | "playing" | "paused" | "gameover" | "victory">("ready");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_breakout_best")) || 0;
    } catch {
      return 0;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Engine state refs to bypass React render cycle in 60fps animation loop
  const paddleRef = useRef({ x: 250, y: 440, w: 100, h: 14, speed: 8, laserActive: 0 });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; space: boolean }>({
    left: false,
    right: false,
    space: false,
  });
  const animationFrameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);

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

  const playSound = useCallback((type: "paddle" | "brick" | "powerup" | "laser" | "bomb" | "lose" | "win") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "paddle") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "brick") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(540 + Math.random() * 100, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "powerup") {
        const notes = [440, 660, 880];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.08, now + i * 0.05);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.1);
        });
      } else if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "bomb") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "win") {
        const notes = [523, 659, 783, 1046];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + i * 0.08);
          g.gain.setValueAtTime(0.1, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.2);
        });
      }
    } catch {}
  }, [soundEnabled]);

  // Generate Bricks for given level
  const generateBricks = (lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = lvl === 1 ? 5 : lvl === 2 ? 6 : 7;
    const cols = 8;
    const brickW = 62;
    const brickH = 18;
    const padding = 8;
    const offsetTop = 40;
    const offsetLeft = 24;

    const colors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pattern gaps for level 2 and 3
        if (lvl === 2 && (r + c) % 4 === 0) continue;
        if (lvl === 3 && (r % 2 === 1 && c % 2 === 1)) continue;

        const maxHp = r === 0 && lvl > 1 ? 2 : 1;
        const isBomb = Math.random() < 0.08;

        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          w: brickW,
          h: brickH,
          health: maxHp,
          maxHealth: maxHp,
          color: isBomb ? "#f43f5e" : colors[r % colors.length],
          isBomb,
        });
      }
    }
    return bricks;
  };

  // Reset ball & paddle
  const resetBallAndPaddle = () => {
    paddleRef.current = {
      x: 250,
      y: 440,
      w: 100,
      h: 14,
      speed: 8,
      laserActive: 0,
    };
    ballsRef.current = [
      {
        x: 300,
        y: 420,
        dx: (Math.random() > 0.5 ? 1 : -1) * (3.5 + levelRef.current * 0.5),
        dy: -4 - levelRef.current * 0.5,
        radius: 6,
      },
    ];
    powerupsRef.current = [];
    lasersRef.current = [];
  };

  // Start new game
  const initGame = useCallback((targetLevel = 1) => {
    levelRef.current = targetLevel;
    setLevel(targetLevel);
    scoreRef.current = targetLevel === 1 ? 0 : scoreRef.current;
    setScore(scoreRef.current);
    livesRef.current = 3;
    setLives(3);
    bricksRef.current = generateBricks(targetLevel);
    resetBallAndPaddle();
    setGameState("ready");
  }, []);

  useEffect(() => {
    initGame(1);
  }, [initGame]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true;
      if (e.key === " " || e.key === "Spacebar") {
        keysRef.current.space = true;
        if (gameState === "ready") {
          setGameState("playing");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false;
      if (e.key === " " || e.key === "Spacebar") keysRef.current.space = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Mouse / Touch paddle tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const clientX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.w, clientX - paddleRef.current.w / 2));
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let laserCooldown = 0;

    const gameLoop = () => {
      // 1. Move Paddle with keyboard
      if (keysRef.current.left) {
        paddleRef.current.x = Math.max(0, paddleRef.current.x - paddleRef.current.speed);
      }
      if (keysRef.current.right) {
        paddleRef.current.x = Math.min(canvas.width - paddleRef.current.w, paddleRef.current.x + paddleRef.current.speed);
      }

      // 2. Fire Laser if active
      if (paddleRef.current.laserActive > 0) {
        paddleRef.current.laserActive--;
        laserCooldown++;
        if (laserCooldown % 15 === 0) {
          playSound("laser");
          lasersRef.current.push({ x: paddleRef.current.x + 8, y: paddleRef.current.y, dy: -8 });
          lasersRef.current.push({ x: paddleRef.current.x + paddleRef.current.w - 8, y: paddleRef.current.y, dy: -8 });
        }
      }

      // 3. Move Lasers
      lasersRef.current.forEach((l, idx) => {
        l.y += l.dy;
        // Check brick collision
        bricksRef.current.forEach((b) => {
          if (b.health > 0 && l.x >= b.x && l.x <= b.x + b.w && l.y >= b.y && l.y <= b.y + b.h) {
            b.health--;
            lasersRef.current.splice(idx, 1);
            playSound("brick");
            scoreRef.current += 15;
            setScore(scoreRef.current);
          }
        });
      });
      lasersRef.current = lasersRef.current.filter((l) => l.y > 0);

      // 4. Move Powerups
      powerupsRef.current.forEach((p, idx) => {
        p.y += p.dy;
        // Check paddle catch
        if (
          p.y + p.radius >= paddleRef.current.y &&
          p.y - p.radius <= paddleRef.current.y + paddleRef.current.h &&
          p.x >= paddleRef.current.x &&
          p.x <= paddleRef.current.x + paddleRef.current.w
        ) {
          playSound("powerup");
          powerupsRef.current.splice(idx, 1);

          if (p.type === "multiball") {
            const b = ballsRef.current[0] || { x: 300, y: 300, dx: 4, dy: -4, radius: 6 };
            ballsRef.current.push({ x: b.x, y: b.y, dx: -b.dx, dy: b.dy, radius: 6 });
            ballsRef.current.push({ x: b.x, y: b.y, dx: b.dy, dy: -b.dx, radius: 6 });
          } else if (p.type === "wide") {
            paddleRef.current.w = 150;
            setTimeout(() => {
              paddleRef.current.w = 100;
            }, 8000);
          } else if (p.type === "laser") {
            paddleRef.current.laserActive = 300; // 5 seconds of laser
          } else if (p.type === "slow") {
            ballsRef.current.forEach((ball) => {
              ball.dx *= 0.7;
              ball.dy *= 0.7;
            });
          } else if (p.type === "fireball") {
            ballsRef.current.forEach((ball) => (ball.isFireball = true));
            setTimeout(() => {
              ballsRef.current.forEach((ball) => (ball.isFireball = false));
            }, 7000);
          } else if (p.type === "life") {
            livesRef.current = Math.min(5, livesRef.current + 1);
            setLives(livesRef.current);
          }
        }
      });
      powerupsRef.current = powerupsRef.current.filter((p) => p.y < canvas.height + 20);

      // 5. Move Balls & Collisions
      ballsRef.current.forEach((ball) => {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.dx = -ball.dx;
          playSound("paddle");
        } else if (ball.x + ball.radius >= canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.dx = -ball.dx;
          playSound("paddle");
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.dy = -ball.dy;
          playSound("paddle");
        }

        // Paddle collision
        if (
          ball.y + ball.radius >= paddleRef.current.y &&
          ball.y - ball.radius <= paddleRef.current.y + paddleRef.current.h &&
          ball.x >= paddleRef.current.x &&
          ball.x <= paddleRef.current.x + paddleRef.current.w
        ) {
          playSound("paddle");
          const hitPos = (ball.x - (paddleRef.current.x + paddleRef.current.w / 2)) / (paddleRef.current.w / 2);
          const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const maxAngle = Math.PI / 3; // 60 deg max
          const angle = hitPos * maxAngle;

          ball.dx = currentSpeed * Math.sin(angle);
          ball.dy = -currentSpeed * Math.cos(angle);
          ball.y = paddleRef.current.y - ball.radius - 1;
        }

        // Brick collision
        bricksRef.current.forEach((brick) => {
          if (brick.health <= 0) return;

          if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.w &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.h
          ) {
            brick.health--;
            scoreRef.current += 20 * levelRef.current;
            setScore(scoreRef.current);

            // Bomb chain reaction
            if (brick.isBomb && brick.health <= 0) {
              playSound("bomb");
              bricksRef.current.forEach((nb) => {
                if (Math.abs(nb.x - brick.x) <= brick.w + 10 && Math.abs(nb.y - brick.y) <= brick.h + 10) {
                  nb.health = 0;
                  scoreRef.current += 20;
                }
              });
            } else {
              playSound("brick");
            }

            // Powerup drop chance
            if (brick.health <= 0 && Math.random() < 0.25) {
              const types: Powerup["type"][] = ["multiball", "wide", "laser", "slow", "fireball", "life"];
              const pType = types[Math.floor(Math.random() * types.length)];
              powerupsRef.current.push({ x: brick.x + brick.w / 2, y: brick.y, type: pType, dy: 2, radius: 8 });
            }

            if (!ball.isFireball) {
              // Determine collision side
              const prevX = ball.x - ball.dx;
              const prevY = ball.y - ball.dy;

              if (prevX + ball.radius <= brick.x || prevX - ball.radius >= brick.x + brick.w) {
                ball.dx = -ball.dx;
              } else {
                ball.dy = -ball.dy;
              }
            }
          }
        });
      });

      // Filter dead balls
      ballsRef.current = ballsRef.current.filter((b) => b.y - b.radius < canvas.height);

      // Check if all balls lost
      if (ballsRef.current.length === 0) {
        livesRef.current--;
        setLives(livesRef.current);

        if (livesRef.current <= 0) {
          setGameState("gameover");
          // Update High Score
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            try {
              localStorage.setItem("minipokie_breakout_best", String(scoreRef.current));
            } catch {}
          }
          return;
        } else {
          resetBallAndPaddle();
          setGameState("ready");
          return;
        }
      }

      // Check Level Clear
      const activeBricks = bricksRef.current.filter((b) => b.health > 0);
      if (activeBricks.length === 0) {
        if (levelRef.current < 3) {
          playSound("win");
          initGame(levelRef.current + 1);
        } else {
          setGameState("victory");
          playSound("win");
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            try {
              localStorage.setItem("minipokie_breakout_best", String(scoreRef.current));
            } catch {}
          }
          return;
        }
      }

      // 6. RENDER FRAME
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Bricks
      bricksRef.current.forEach((brick) => {
        if (brick.health <= 0) return;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();

        // Brick border highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bomb icon indicator
        if (brick.isBomb) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px sans-serif";
          ctx.fillText("💣", brick.x + brick.w / 2 - 6, brick.y + brick.h / 2 + 3);
        }
      });

      // Render Paddle
      ctx.fillStyle = paddleRef.current.laserActive > 0 ? "#ec4899" : "#6366f1";
      ctx.beginPath();
      ctx.roundRect(paddleRef.current.x, paddleRef.current.y, paddleRef.current.w, paddleRef.current.h, 7);
      ctx.fill();

      // Render Lasers
      ctx.fillStyle = "#f43f5e";
      lasersRef.current.forEach((l) => {
        ctx.fillRect(l.x - 1.5, l.y, 3, 10);
      });

      // Render Powerups
      powerupsRef.current.forEach((p) => {
        ctx.fillStyle =
          p.type === "multiball"
            ? "#eab308"
            : p.type === "wide"
            ? "#3b82f6"
            : p.type === "laser"
            ? "#ec4899"
            : p.type === "fireball"
            ? "#ef4444"
            : "#10b981";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Balls
      ballsRef.current.forEach((ball) => {
        ctx.fillStyle = ball.isFireball ? "#f97316" : "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, highScore, initGame, playSound]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center">
      {/* Header Controls */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-800 dark:text-white">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Brick Breaker Arcade</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            Level {level} / 3
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="bb-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="bb-reset-btn"
            onClick={() => initGame(1)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* HUD Cards (Score, High Score, Lives) */}
      <div className="w-full grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-xl font-black text-slate-800 dark:text-white font-mono mt-0.5">{score}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Score</div>
          <div className="text-xl font-black text-amber-500 font-mono mt-0.5">{highScore}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lives</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < lives ? "text-rose-500 fill-rose-500" : "text-slate-300 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Interactive 60fps Canvas Arena */}
      <div className="relative w-full max-w-[600px] bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden aspect-[4/3]">
        <canvas
          ref={canvasRef}
          width={600}
          height={460}
          onPointerMove={handlePointerMove}
          onClick={() => {
            if (gameState === "ready") setGameState("playing");
          }}
          className="w-full h-full cursor-none select-none block"
        />

        {/* Overlay for Ready State */}
        {gameState === "ready" && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
            <h3 className="text-xl font-black">Level {level} Ready</h3>
            <p className="text-xs text-slate-300 max-w-xs">
              Move your mouse, touch drag, or use Left/Right arrow keys. Press Space or Click to launch ball!
            </p>
            <button
              onClick={() => setGameState("playing")}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Ball</span>
            </button>
          </div>
        )}

        {/* Overlay for Game Over */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="text-3xl font-black text-rose-500">Game Over</div>
            <div className="text-sm text-slate-300">
              Final Score: <strong className="text-white">{score}</strong>
            </div>
            <button
              onClick={() => initGame(1)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Overlay for Victory */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="text-3xl font-black text-amber-400 flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              <span>Champion!</span>
            </div>
            <div className="text-sm text-slate-300">
              You smashed all 3 levels! Final Score: <strong className="text-white">{score}</strong>
            </div>
            <button
              onClick={() => initGame(1)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Control instructions */}
      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
        <span>Controls: Mouse move / Touch drag / Left & Right Arrow keys</span>
        <span>Space: Launch ball</span>
      </div>
    </div>
  );
};
