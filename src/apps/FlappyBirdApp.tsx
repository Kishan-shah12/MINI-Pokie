import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Flame,
  Award,
  Sparkles,
} from "lucide-react";

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
}

export const FlappyBirdApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(() => {
    try {
      return Number(localStorage.getItem("minipokie_flappy_coins")) || 0;
    } catch {
      return 0;
    }
  });

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_flappy_best")) || 0;
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mutable Game State Ref for 60 FPS loop
  const stateRef = useRef({
    birdY: 200,
    birdVy: 0,
    birdAngle: 0,
    pipes: [] as Pipe[],
    groundOffset: 0,
    score: 0,
    coins: 0,
    soundEnabled: true,
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

  const playSound = useCallback((type: "flap" | "score" | "coin" | "hit" | "die") => {
    if (!stateRef.current.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "flap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "score") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "coin") {
        const notes = [880, 1320];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.08, now + i * 0.05);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.1);
        });
      } else if (type === "hit") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {}
  }, []);

  // Jump Flap Action
  const handleFlap = useCallback(() => {
    if (isGameOver) return;
    if (!isPlaying) {
      startGame();
      return;
    }
    stateRef.current.birdVy = -6.8;
    playSound("flap");
  }, [isPlaying, isGameOver, playSound]);

  // Start / Restart Game
  const startGame = () => {
    stateRef.current = {
      birdY: 200,
      birdVy: -4,
      birdAngle: 0,
      pipes: [
        { x: 380, topHeight: 120, bottomY: 240, passed: false, hasCoin: true, coinCollected: false },
        { x: 560, topHeight: 160, bottomY: 280, passed: false, hasCoin: false, coinCollected: false },
      ],
      groundOffset: 0,
      score: 0,
      coins,
      soundEnabled,
    };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    playSound("flap");
  };

  // Keyboard and Touch listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleFlap]);

  // 60FPS Game Engine Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gap = 118; // Pipe vertical gap
    const pipeWidth = 52;
    const pipeSpeed = 2.4;
    const gravity = 0.36;
    const birdRadius = 13;
    const birdX = 75;

    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;
      const groundH = 65;
      const playableH = h - groundH;

      const s = stateRef.current;
      s.soundEnabled = soundEnabled;

      if (isPlaying && !isGameOver) {
        // 1. Bird Physics
        s.birdVy += gravity;
        s.birdY += s.birdVy;
        s.birdAngle = Math.min(Math.PI / 2.2, Math.max(-Math.PI / 4, s.birdVy * 0.12));

        // Ground & Ceiling collision
        if (s.birdY + birdRadius >= playableH) {
          s.birdY = playableH - birdRadius;
          handleCrash();
        }
        if (s.birdY - birdRadius <= 0) {
          s.birdY = birdRadius;
          s.birdVy = 0;
        }

        // 2. Pipes Movement & Generation
        s.groundOffset = (s.groundOffset + pipeSpeed) % 20;

        s.pipes.forEach((p) => {
          p.x -= pipeSpeed;

          // Score check
          if (!p.passed && p.x + pipeWidth < birdX) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
            playSound("score");
          }

          // Coin pickup check
          if (p.hasCoin && !p.coinCollected) {
            const coinX = p.x + pipeWidth / 2;
            const coinY = p.topHeight + gap / 2;
            const dist = Math.hypot(birdX - coinX, s.birdY - coinY);
            if (dist < birdRadius + 10) {
              p.coinCollected = true;
              s.coins += 1;
              setCoins(s.coins);
              playSound("coin");
              try {
                localStorage.setItem("minipokie_flappy_coins", String(s.coins));
              } catch {}
            }
          }

          // Pipe Collision check (Bounding boxes)
          if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + pipeWidth) {
            if (s.birdY - birdRadius < p.topHeight || s.birdY + birdRadius > p.bottomY) {
              handleCrash();
            }
          }
        });

        // Remove old pipes
        s.pipes = s.pipes.filter((p) => p.x > -pipeWidth - 20);

        // Spawn new pipes
        const lastPipe = s.pipes[s.pipes.length - 1];
        if (!lastPipe || lastPipe.x < w - 170) {
          const topH = Math.floor(Math.random() * (playableH - gap - 90)) + 45;
          s.pipes.push({
            x: w + 20,
            topHeight: topH,
            bottomY: topH + gap,
            passed: false,
            hasCoin: Math.random() < 0.5,
            coinCollected: false,
          });
        }
      }

      // 3. Render Visuals
      ctx.clearRect(0, 0, w, h);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, playableH);
      skyGrad.addColorStop(0, "#38bdf8");
      skyGrad.addColorStop(0.7, "#7dd3fc");
      skyGrad.addColorStop(1, "#bae6fd");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, playableH);

      // Distant City Skyline & Clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(80, 70, 26, 0, Math.PI * 2);
      ctx.arc(115, 65, 34, 0, Math.PI * 2);
      ctx.arc(150, 70, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(260, 110, 22, 0, Math.PI * 2);
      ctx.arc(290, 105, 30, 0, Math.PI * 2);
      ctx.arc(320, 110, 22, 0, Math.PI * 2);
      ctx.fill();

      // Pipes rendering
      s.pipes.forEach((p) => {
        // Top Pipe
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, 0, pipeWidth, p.topHeight);

        // Top Pipe Lip Cap
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(p.x - 3, p.topHeight - 18, pipeWidth + 6, 18);
        ctx.strokeRect(p.x - 3, p.topHeight - 18, pipeWidth + 6, 18);

        // Bottom Pipe
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(p.x, p.bottomY, pipeWidth, playableH - p.bottomY);
        ctx.strokeRect(p.x, p.bottomY, pipeWidth, playableH - p.bottomY);

        // Bottom Pipe Lip Cap
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(p.x - 3, p.bottomY, pipeWidth + 6, 18);
        ctx.strokeRect(p.x - 3, p.bottomY, pipeWidth + 6, 18);

        // Hovering Coin
        if (p.hasCoin && !p.coinCollected) {
          const coinX = p.x + pipeWidth / 2;
          const coinY = p.topHeight + gap / 2;
          ctx.save();
          ctx.translate(coinX, coinY);
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fillStyle = "#facc15";
          ctx.fill();
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#a16207";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", 0, 0);
          ctx.restore();
        }
      });

      // Ground (Dirt & Grass Top)
      ctx.fillStyle = "#d97706";
      ctx.fillRect(0, playableH, w, groundH);
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(0, playableH, w, 14);

      // Diagonal ground stripe pattern
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 3;
      for (let x = -20 - s.groundOffset; x < w + 20; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, playableH + 14);
        ctx.lineTo(x + 10, h);
        ctx.stroke();
      }

      // 4. Draw Yellow Bird Character
      ctx.save();
      ctx.translate(birdX, s.birdY);
      ctx.rotate(s.birdAngle);

      // Yellow Body
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing (flaps when jumping)
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 5, s.birdVy < 0 ? -0.4 : 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Orange Beak
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(18, 3);
      ctx.lineTo(9, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, soundEnabled, playSound]);

  const handleCrash = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playSound("hit");

    if (stateRef.current.score > highScore) {
      setHighScore(stateRef.current.score);
      try {
        localStorage.setItem("minipokie_flappy_best", String(stateRef.current.score));
      } catch {}
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  };

  const getMedal = (pts: number) => {
    if (pts >= 50) return { title: "Platinum", color: "text-cyan-400 bg-cyan-950" };
    if (pts >= 30) return { title: "Gold", color: "text-yellow-400 bg-yellow-950" };
    if (pts >= 15) return { title: "Silver", color: "text-slate-300 bg-slate-800" };
    if (pts >= 5) return { title: "Bronze", color: "text-amber-600 bg-amber-950" };
    return null;
  };

  const medal = getMedal(score);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 flex flex-col items-center select-none">
      {/* HUD Header */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Award className="w-4 h-4 text-yellow-500" />
            <span>Flappy Bird 60FPS Arcade</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Stats Dashboard (Score, Coins, High Score) */}
      <div className="w-full grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-xl font-black text-yellow-500 font-mono mt-0.5">{score}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coins</div>
          <div className="text-xl font-black text-amber-500 font-mono mt-0.5">{coins} 🪙</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Record</div>
          <div className="text-xl font-black text-indigo-500 font-mono mt-0.5">{highScore}</div>
        </div>
      </div>

      {/* 60FPS Canvas Screen */}
      <div
        onClick={handleFlap}
        className="relative w-full aspect-[4/5] max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-sky-400 cursor-pointer flex items-center justify-center select-none"
      >
        <canvas ref={canvasRef} width={380} height={475} className="w-full h-full object-cover" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Flappy Bird Arcade</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Tap, click, or press Spacebar to flap wings and navigate through pipes.
              </p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-yellow-500/30 flex items-center gap-2 active:scale-95 transition"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Tap to Flap</span>
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-in zoom-in-95">
            <div className="text-3xl font-black text-rose-500">Game Over</div>
            <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-2xl w-full max-w-xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Score:</span>
                <span className="font-black text-lg text-white font-mono">{score}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Best:</span>
                <span className="font-black text-lg text-yellow-400 font-mono">{highScore}</span>
              </div>
              {medal && (
                <div className={`mt-2 py-1 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${medal.color}`}>
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{medal.title} Medal Earned!</span>
                </div>
              )}
            </div>

            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Flap Again</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 text-center font-mono">
        Tap screen, click, or press Spacebar / Up Arrow to flap
      </div>
    </div>
  );
};
