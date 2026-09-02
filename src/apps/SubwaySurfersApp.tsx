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
  Shield,
  Magnet,
  Flame,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";

interface Obstacle {
  id: number;
  z: number; // Distance ahead in track units (0 to 1000)
  lane: number; // 0: Left, 1: Center, 2: Right
  type: "train" | "hurdle_low" | "hurdle_high" | "coin" | "magnet" | "sneakers" | "multiplier" | "hoverboard";
}

export const SubwaySurfersApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_subwaysurfers_best")) || 0;
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active powerups states (seconds remaining)
  const [magnetTime, setMagnetTime] = useState(0);
  const [sneakersTime, setSneakersTime] = useState(0);
  const [multiplierTime, setMultiplierTime] = useState(0);
  const [hasHoverboard, setHasHoverboard] = useState(false);

  // Mutable Game State Ref for 60fps loop
  const stateRef = useRef({
    lane: 1, // 0: left, 1: center, 2: right
    targetLaneX: 0,
    currentLaneX: 0,
    y: 0, // Jump height (0 = ground)
    vy: 0, // Jump vertical velocity
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    speed: 6.5,
    distance: 0,
    obstacles: [] as Obstacle[],
    nextObstacleDist: 40,
    magnetTime: 0,
    sneakersTime: 0,
    multiplierTime: 0,
    hasHoverboard: false,
    score: 0,
    coins: 0,
    soundEnabled: true,
  });

  // Audio Context Ref
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

  const playSound = useCallback((type: "coin" | "jump" | "slide" | "powerup" | "crash" | "hoverboard") => {
    if (!stateRef.current.soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "jump") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "slide") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "powerup") {
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.08, now + i * 0.05);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.12);
        });
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {}
  }, []);

  // Keyboard and touch controls
  const handleMoveLeft = useCallback(() => {
    if (stateRef.current.lane > 0) {
      stateRef.current.lane -= 1;
      playSound("slide");
    }
  }, [playSound]);

  const handleMoveRight = useCallback(() => {
    if (stateRef.current.lane < 2) {
      stateRef.current.lane += 1;
      playSound("slide");
    }
  }, [playSound]);

  const handleJump = useCallback(() => {
    if (!stateRef.current.isJumping) {
      stateRef.current.isJumping = true;
      stateRef.current.vy = stateRef.current.sneakersTime > 0 ? 15 : 11.5;
      stateRef.current.isSliding = false;
      stateRef.current.slideTimer = 0;
      playSound("jump");
    }
  }, [playSound]);

  const handleSlide = useCallback(() => {
    if (stateRef.current.isJumping) {
      stateRef.current.vy = -16; // Fast drop
    } else {
      stateRef.current.isSliding = true;
      stateRef.current.slideTimer = 35; // ~0.6 seconds at 60fps
      playSound("slide");
    }
  }, [playSound]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver || isPaused) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleMoveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        handleMoveRight();
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        e.preventDefault();
        handleJump();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSlide();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, isGameOver, isPaused, handleMoveLeft, handleMoveRight, handleJump, handleSlide]);

  // Touch Swipes
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
      if (dx < 0) handleMoveLeft();
      else handleMoveRight();
    } else if (Math.abs(dy) > 25) {
      if (dy < 0) handleJump();
      else handleSlide();
    }
    touchStartRef.current = null;
  };

  // Start / Restart Game
  const startGame = () => {
    stateRef.current = {
      lane: 1,
      targetLaneX: 0,
      currentLaneX: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      speed: 6.5,
      distance: 0,
      obstacles: [],
      nextObstacleDist: 40,
      magnetTime: 0,
      sneakersTime: 0,
      multiplierTime: 0,
      hasHoverboard: false,
      score: 0,
      coins: 0,
      soundEnabled,
    };

    setScore(0);
    setCoins(0);
    setMagnetTime(0);
    setSneakersTime(0);
    setMultiplierTime(0);
    setHasHoverboard(false);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  };

  // Spawn Obstacles & Pickups
  const spawnTrackRow = (zDist: number) => {
    const laneOptions = [0, 1, 2];
    const rand = Math.random();

    // 15% chance of Powerup
    if (rand < 0.12) {
      const pTypes: Obstacle["type"][] = ["magnet", "sneakers", "multiplier", "hoverboard"];
      const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
      stateRef.current.obstacles.push({
        id: Math.random(),
        z: zDist,
        lane: Math.floor(Math.random() * 3),
        type: chosen,
      });
      return;
    }

    // 40% chance of coins trail (3 coins in a line)
    if (rand < 0.5) {
      const cLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 4; i++) {
        stateRef.current.obstacles.push({
          id: Math.random(),
          z: zDist + i * 22,
          lane: cLane,
          type: "coin",
        });
      }
      return;
    }

    // Otherwise standard obstacles (Trains, Low Hurdles, High Hurdles)
    const obstType = Math.random() < 0.5 ? "train" : Math.random() < 0.5 ? "hurdle_low" : "hurdle_high";
    const occupiedLanes = [Math.floor(Math.random() * 3)];

    // Occasional double obstacles at higher speed
    if (stateRef.current.speed > 8.5 && Math.random() < 0.4) {
      const second = (occupiedLanes[0] + 1) % 3;
      occupiedLanes.push(second);
    }

    occupiedLanes.forEach((l) => {
      stateRef.current.obstacles.push({
        id: Math.random(),
        z: zDist,
        lane: l,
        type: obstType,
      });
    });
  };

  // Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (!isPlaying || isGameOver || isPaused) {
        animId = requestAnimationFrame(render);
        return;
      }

      const s = stateRef.current;
      s.soundEnabled = soundEnabled;

      // 1. Update Game State
      s.distance += s.speed;
      s.speed = Math.min(13.5, 6.5 + s.distance * 0.0007);

      const scoreMultiplier = s.multiplierTime > 0 ? 2 : 1;
      s.score += Math.round(s.speed * 0.1 * scoreMultiplier);
      setScore(s.score);

      // Powerups Countdown
      if (s.magnetTime > 0) {
        s.magnetTime = Math.max(0, s.magnetTime - 1 / 60);
        setMagnetTime(Math.ceil(s.magnetTime));
      }
      if (s.sneakersTime > 0) {
        s.sneakersTime = Math.max(0, s.sneakersTime - 1 / 60);
        setSneakersTime(Math.ceil(s.sneakersTime));
      }
      if (s.multiplierTime > 0) {
        s.multiplierTime = Math.max(0, s.multiplierTime - 1 / 60);
        setMultiplierTime(Math.ceil(s.multiplierTime));
      }

      // Smooth horizontal lane interpolation
      s.targetLaneX = (s.lane - 1) * 85; // -85, 0, 85
      s.currentLaneX += (s.targetLaneX - s.currentLaneX) * 0.28;

      // Jump & gravity physics
      if (s.isJumping) {
        s.y += s.vy;
        s.vy -= 0.65; // gravity
        if (s.y <= 0) {
          s.y = 0;
          s.vy = 0;
          s.isJumping = false;
        }
      }

      // Slide countdown
      if (s.isSliding) {
        s.slideTimer -= 1;
        if (s.slideTimer <= 0) {
          s.isSliding = false;
        }
      }

      // Obstacles generation
      s.nextObstacleDist -= s.speed;
      if (s.nextObstacleDist <= 0) {
        spawnTrackRow(900);
        s.nextObstacleDist = Math.max(70, 140 - s.speed * 4);
      }

      // 2. Clear Screen & Draw Dynamic 3D Perspective Canvas
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Sky & City Backdrop
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      skyGrad.addColorStop(0, "#090d16");
      skyGrad.addColorStop(0.7, "#1e1b4b");
      skyGrad.addColorStop(1, "#312e81");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      // Distant City Skyline Buildings
      ctx.fillStyle = "#111827";
      for (let i = 0; i < 12; i++) {
        const bx = i * 40 - 20;
        const bh = 40 + (i % 5) * 15;
        ctx.fillRect(bx, h * 0.45 - bh, 32, bh);
        // Windows
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(bx + 6, h * 0.45 - bh + 10, 4, 6);
        ctx.fillRect(bx + 18, h * 0.45 - bh + 18, 4, 6);
        ctx.fillStyle = "#111827";
      }

      // Perspective Track Ground
      const groundGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      groundGrad.addColorStop(0, "#1f2937");
      groundGrad.addColorStop(1, "#111827");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      const vanishX = w / 2;
      const vanishY = h * 0.45;

      // 3 Receding Track Rails
      const laneSpreadBottom = 160;
      const laneSpreadTop = 20;

      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 3;

      // Draw Rails
      for (let l = -1.5; l <= 1.5; l += 1) {
        const topX = vanishX + l * laneSpreadTop;
        const botX = vanishX + l * laneSpreadBottom;
        ctx.beginPath();
        ctx.moveTo(topX, vanishY);
        ctx.lineTo(botX, h);
        ctx.stroke();
      }

      // Draw Receding Railway Ties
      const offset = (s.distance * 1.5) % 40;
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 2;
      for (let z = 40 - offset; z < 450; z += 35) {
        const ratio = z / 450;
        const curY = vanishY + (h - vanishY) * (ratio * ratio);
        const curWidth = laneSpreadBottom * ratio * 3;
        ctx.beginPath();
        ctx.moveTo(vanishX - curWidth / 2, curY);
        ctx.lineTo(vanishX + curWidth / 2, curY);
        ctx.stroke();
      }

      // 3. Update & Draw Obstacles (sorted by z-distance)
      s.obstacles.forEach((ob) => {
        ob.z -= s.speed;
      });

      // Remove passed obstacles
      s.obstacles = s.obstacles.filter((ob) => ob.z > -80);

      // Sort furthest to closest for proper rendering depth
      const sortedObstacles = [...s.obstacles].sort((a, b) => b.z - a.z);

      sortedObstacles.forEach((ob) => {
        if (ob.z <= 0) return;
        const depth = 1 - ob.z / 900;
        if (depth < 0) return;

        // Perspective scale & positioning
        const scale = Math.max(0.15, depth * depth);
        const laneOffset = (ob.lane - 1) * (laneSpreadBottom * depth);
        const objX = vanishX + laneOffset;
        const objY = vanishY + (h - vanishY) * (depth * depth);

        // Magnet attraction for coins
        if (ob.type === "coin" && s.magnetTime > 0 && ob.z < 400) {
          const targetX = vanishX + s.currentLaneX * depth;
          ob.lane = s.lane;
        }

        // Draw Object Types
        if (ob.type === "coin") {
          ctx.save();
          ctx.translate(objX, objY - 20 * scale);
          ctx.beginPath();
          ctx.arc(0, 0, 14 * scale, 0, Math.PI * 2);
          ctx.fillStyle = "#facc15";
          ctx.fill();
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 2 * scale;
          ctx.stroke();
          ctx.fillStyle = "#a16207";
          ctx.font = `bold ${Math.round(14 * scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", 0, 0);
          ctx.restore();
        } else if (ob.type === "train") {
          const trainW = 75 * scale;
          const trainH = 110 * scale;
          ctx.save();
          ctx.translate(objX, objY);

          // Train Body
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(-trainW / 2, -trainH, trainW, trainH);
          ctx.strokeStyle = "#991b1b";
          ctx.lineWidth = 3 * scale;
          ctx.strokeRect(-trainW / 2, -trainH, trainW, trainH);

          // Windshield & Headlights
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(-trainW * 0.35, -trainH * 0.85, trainW * 0.7, trainH * 0.35);

          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(-trainW * 0.25, -trainH * 0.25, 7 * scale, 0, Math.PI * 2);
          ctx.arc(trainW * 0.25, -trainH * 0.25, 7 * scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else if (ob.type === "hurdle_low") {
          const barW = 65 * scale;
          const barH = 35 * scale;
          ctx.save();
          ctx.translate(objX, objY);

          // Yellow/Black warning stripes
          ctx.fillStyle = "#eab308";
          ctx.fillRect(-barW / 2, -barH, barW, barH);
          ctx.fillStyle = "#18181b";
          for (let i = -barW / 2; i < barW / 2; i += 12 * scale) {
            ctx.fillRect(i, -barH, 6 * scale, barH);
          }
          ctx.restore();
        } else if (ob.type === "hurdle_high") {
          const barW = 70 * scale;
          const barH = 80 * scale;
          ctx.save();
          ctx.translate(objX, objY);

          // Elevated Barrier with empty bottom for sliding
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(-barW / 2, -barH, barW, barH * 0.5);
          ctx.fillStyle = "#1e3a8a";
          ctx.fillRect(-barW / 2, -barH * 0.5, barW, 4 * scale);

          // Legs
          ctx.fillStyle = "#475569";
          ctx.fillRect(-barW / 2, -barH, 6 * scale, barH);
          ctx.fillRect(barW / 2 - 6 * scale, -barH, 6 * scale, barH);
          ctx.restore();
        } else {
          // Powerups (Magnet, Sneakers, Multiplier, Hoverboard)
          ctx.save();
          ctx.translate(objX, objY - 25 * scale);
          ctx.beginPath();
          ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
          ctx.fillStyle =
            ob.type === "magnet"
              ? "#ef4444"
              : ob.type === "sneakers"
              ? "#10b981"
              : ob.type === "multiplier"
              ? "#8b5cf6"
              : "#06b6d4";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2 * scale;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = `${Math.round(18 * scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const icon =
            ob.type === "magnet" ? "🧲" : ob.type === "sneakers" ? "👟" : ob.type === "multiplier" ? "2X" : "🛹";
          ctx.fillText(icon, 0, 0);
          ctx.restore();
        }

        // 4. Collision Detection Check
        if (ob.z > 20 && ob.z < 85 && ob.lane === s.lane) {
          if (ob.type === "coin") {
            s.coins += 1;
            s.score += 50 * scoreMultiplier;
            setCoins(s.coins);
            playSound("coin");
            ob.z = -999; // consume
          } else if (ob.type === "magnet") {
            s.magnetTime = 10;
            setMagnetTime(10);
            playSound("powerup");
            ob.z = -999;
          } else if (ob.type === "sneakers") {
            s.sneakersTime = 10;
            setSneakersTime(10);
            playSound("powerup");
            ob.z = -999;
          } else if (ob.type === "multiplier") {
            s.multiplierTime = 12;
            setMultiplierTime(12);
            playSound("powerup");
            ob.z = -999;
          } else if (ob.type === "hoverboard") {
            s.hasHoverboard = true;
            setHasHoverboard(true);
            playSound("powerup");
            ob.z = -999;
          } else if (ob.type === "hurdle_low") {
            if (s.y < 30) {
              // Collided unless jumped high enough
              handlePlayerCrash();
            }
          } else if (ob.type === "hurdle_high") {
            if (!s.isSliding) {
              // Collided unless sliding
              handlePlayerCrash();
            }
          } else if (ob.type === "train") {
            handlePlayerCrash();
          }
        }
      });

      // 5. Draw Player Character
      const playerScreenX = vanishX + s.currentLaneX;
      const playerScreenY = h - 60 - s.y;

      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);

      // Hoverboard under feet
      if (s.hasHoverboard) {
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.ellipse(0, 18, 28, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Shadow on ground
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 20 + s.y, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (s.isSliding) {
        // Sliding / Rolling posture
        ctx.fillStyle = "#f97316"; // Orange hoodie
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cap
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(8, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Running / Jumping posture
        // Body (Hoodie)
        ctx.fillStyle = "#f97316";
        ctx.fillRect(-12, -28, 24, 28);

        // Head & Cap
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.arc(0, -36, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#3b82f6"; // Blue Cap
        ctx.fillRect(-10, -45, 20, 7);
        ctx.fillRect(-4, -40, 16, 3); // Brim

        // Legs (Jeans)
        ctx.fillStyle = "#1e3a8a";
        const legSwing = Math.sin(s.distance * 0.2) * 8;
        ctx.fillRect(-10, 0, 8, 16 + (s.isJumping ? 0 : legSwing));
        ctx.fillRect(2, 0, 8, 16 + (s.isJumping ? 0 : -legSwing));

        // Sneakers
        ctx.fillStyle = s.sneakersTime > 0 ? "#10b981" : "#ffffff";
        ctx.fillRect(-11, 14 + (s.isJumping ? 0 : legSwing), 10, 6);
        ctx.fillRect(1, 14 + (s.isJumping ? 0 : -legSwing), 10, 6);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isPaused, soundEnabled, playSound]);

  const handlePlayerCrash = () => {
    if (stateRef.current.hasHoverboard) {
      // Use hoverboard as shield
      stateRef.current.hasHoverboard = false;
      setHasHoverboard(false);
      playSound("powerup");
      return;
    }

    setIsGameOver(true);
    setIsPlaying(false);
    playSound("crash");

    if (stateRef.current.score > highScore) {
      setHighScore(stateRef.current.score);
      try {
        localStorage.setItem("minipokie_subwaysurfers_best", String(stateRef.current.score));
      } catch {}
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 flex flex-col items-center select-none">
      {/* HUD Header */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>Subway 3D Runner</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Stats Dashboard (Score, Coins, HighScore) */}
      <div className="w-full grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono mt-0.5">{score}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coins</div>
          <div className="text-xl font-black text-yellow-500 font-mono mt-0.5 flex items-center justify-center gap-1">
            <span>💰</span>
            <span>{coins}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Score</div>
          <div className="text-xl font-black text-indigo-500 font-mono mt-0.5">{highScore}</div>
        </div>
      </div>

      {/* Active Powerup Badges */}
      {(magnetTime > 0 || sneakersTime > 0 || multiplierTime > 0 || hasHoverboard) && (
        <div className="w-full flex items-center justify-center gap-2 flex-wrap">
          {magnetTime > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-black flex items-center gap-1 animate-pulse">
              <Magnet className="w-3.5 h-3.5" /> Magnet ({magnetTime}s)
            </span>
          )}
          {sneakersTime > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1 animate-pulse">
              <Zap className="w-3.5 h-3.5" /> High Jump ({sneakersTime}s)
            </span>
          )}
          {multiplierTime > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-black flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> 2X Multiplier ({multiplierTime}s)
            </span>
          )}
          {hasHoverboard && (
            <span className="px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 text-xs font-black flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Shield Active
            </span>
          )}
        </div>
      )}

      {/* Main 60FPS Canvas Viewport */}
      <div
        className="relative w-full aspect-[4/5] max-w-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} width={400} height={500} className="w-full h-full object-cover" />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Subway 3D Runner</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Dodge trains, jump over hurdles, and roll under barriers.
              </p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/30 flex items-center gap-2 active:scale-95 transition"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Tap to Run</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-in zoom-in-95">
            <div className="text-3xl font-black text-rose-500">Crashed!</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Final Score: <strong className="text-white text-base">{score}</strong></p>
              <p className="text-xs text-slate-400">Coins Collected: <strong className="text-yellow-400">{coins}</strong></p>
            </div>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Run Again</span>
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Touch Controls */}
      <div className="w-full max-w-[420px] grid grid-cols-4 gap-2 pt-1">
        <button
          onClick={handleMoveLeft}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex flex-col items-center justify-center active:scale-90 transition shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Left</span>
        </button>

        <button
          onClick={handleJump}
          className="p-3 rounded-2xl bg-orange-500 text-white font-bold flex flex-col items-center justify-center active:scale-90 transition shadow-md"
        >
          <ArrowUp className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Jump</span>
        </button>

        <button
          onClick={handleSlide}
          className="p-3 rounded-2xl bg-indigo-600 text-white font-bold flex flex-col items-center justify-center active:scale-90 transition shadow-md"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Slide</span>
        </button>

        <button
          onClick={handleMoveRight}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex flex-col items-center justify-center active:scale-90 transition shadow-xs"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Right</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 text-center font-mono">
        Keyboard: Arrow Keys / WASD • Swipe on touch screens
      </div>
    </div>
  );
};
