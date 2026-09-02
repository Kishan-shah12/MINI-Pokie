import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Flame,
  ArrowLeft,
  ArrowRight,
  Shield,
  Gauge,
  Fuel,
  Sparkles,
} from "lucide-react";

interface UpgradeState {
  engine: number; // 1 to 5
  suspension: number;
  tires: number;
  fuelCap: number;
}

export const HillClimbApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [crashReason, setCrashReason] = useState<"neck" | "fuel">("neck");

  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(() => {
    try {
      return Number(localStorage.getItem("minipokie_hillclimb_coins")) || 150;
    } catch {
      return 150;
    }
  });

  const [fuel, setFuel] = useState(100);
  const [airTimeBonus, setAirTimeBonus] = useState<string | null>(null);

  const [bestDistance, setBestDistance] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("minipokie_hillclimb_best")) || 0;
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Vehicle Upgrades State
  const [upgrades, setUpgrades] = useState<UpgradeState>(() => {
    try {
      const saved = localStorage.getItem("minipokie_hillclimb_upgrades");
      return saved ? JSON.parse(saved) : { engine: 1, suspension: 1, tires: 1, fuelCap: 1 };
    } catch {
      return { engine: 1, suspension: 1, tires: 1, fuelCap: 1 };
    }
  });

  // Mutable Physics State Ref for 60FPS loop
  const physRef = useRef({
    // Vehicle Position & Angles
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    // Controls
    gas: false,
    brake: false,
    // Physics parameters
    fuel: 100,
    maxFuel: 100,
    coinsCollected: 0,
    totalCoins: 150,
    airTime: 0,
    flips: 0,
    prevAngle: 0,
    accumulatedRotation: 0,
    inAir: false,
    soundEnabled: true,
    engineLevel: 1,
    suspensionLevel: 1,
    tiresLevel: 1,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

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

  const playSound = useCallback((type: "coin" | "fuel" | "flip" | "crash") => {
    if (!physRef.current.soundEnabled) return;
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
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "fuel") {
        const notes = [440, 660, 880];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, now + i * 0.06);
          g.gain.setValueAtTime(0.08, now + i * 0.06);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.06);
          o.stop(now + i * 0.06 + 0.12);
        });
      } else if (type === "flip") {
        const notes = [587, 740, 880, 1174];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + i * 0.05);
          g.gain.setValueAtTime(0.1, now + i * 0.05);
          g.gain.linearRampToValueAtTime(0.001, now + i * 0.05 + 0.14);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.05);
          o.stop(now + i * 0.05 + 0.14);
        });
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {}
  }, []);

  // Continuous Terrain Height Formula
  const getTerrainY = (worldX: number): number => {
    if (worldX < 0) return 300;
    const h1 = Math.sin(worldX * 0.003) * 60;
    const h2 = Math.sin(worldX * 0.008 + 1.2) * 35;
    const h3 = Math.cos(worldX * 0.015) * 18;
    const h4 = Math.sin(worldX * 0.0005) * 80;
    return 320 + h1 + h2 + h3 + h4;
  };

  // Terrain Tangent Angle (slope)
  const getTerrainSlope = (worldX: number): number => {
    const delta = 2;
    const y1 = getTerrainY(worldX - delta);
    const y2 = getTerrainY(worldX + delta);
    return Math.atan2(y2 - y1, delta * 2);
  };

  // Spawned Collectibles cache along terrain
  const getCollectible = (chunkIdx: number): { type: "coin" | "fuel"; x: number; y: number } | null => {
    const x = chunkIdx * 180 + 250;
    if (chunkIdx % 7 === 0 && chunkIdx > 0) {
      return { type: "fuel", x, y: getTerrainY(x) - 25 };
    } else if (chunkIdx % 2 === 0) {
      return { type: "coin", x, y: getTerrainY(x) - 20 };
    }
    return null;
  };

  // Start / Restart Drive
  const startDrive = () => {
    const maxF = 80 + upgrades.fuelCap * 25;
    physRef.current = {
      x: 100,
      y: getTerrainY(100) - 40,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      gas: false,
      brake: false,
      fuel: maxF,
      maxFuel: maxF,
      coinsCollected: 0,
      totalCoins: coins,
      airTime: 0,
      flips: 0,
      prevAngle: 0,
      accumulatedRotation: 0,
      inAir: false,
      soundEnabled,
      engineLevel: upgrades.engine,
      suspensionLevel: upgrades.suspension,
      tiresLevel: upgrades.tires,
    };

    setDistance(0);
    setFuel(100);
    setAirTimeBonus(null);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        physRef.current.gas = true;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        physRef.current.brake = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        physRef.current.gas = false;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        physRef.current.brake = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isPlaying, isGameOver]);

  // Main 60FPS Physics Engine Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const collectedIds = new Set<number>();

    const loop = () => {
      if (!isPlaying || isGameOver) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const p = physRef.current;
      p.soundEnabled = soundEnabled;

      // 1. Vehicle Physics Constants
      const gravity = 0.42;
      const wheelBase = 32; // Distance between front and rear wheels
      const enginePower = 0.38 + p.engineLevel * 0.12;
      const tireFriction = 0.88 + p.tiresLevel * 0.025;
      const suspensionStiffness = 0.28 + p.suspensionLevel * 0.06;

      // Wheel positions relative to car center
      const rearWheelX = p.x - Math.cos(p.angle) * (wheelBase / 2);
      const rearWheelY = p.y - Math.sin(p.angle) * (wheelBase / 2);

      const frontWheelX = p.x + Math.cos(p.angle) * (wheelBase / 2);
      const frontWheelY = p.y + Math.sin(p.angle) * (wheelBase / 2);

      // Ground heights under wheels
      const rearGroundY = getTerrainY(rearWheelX);
      const frontGroundY = getTerrainY(frontWheelX);

      const rearOnGround = rearWheelY >= rearGroundY - 14;
      const frontOnGround = frontWheelY >= frontGroundY - 14;
      const onGround = rearOnGround || frontOnGround;

      // Air time tracking
      if (!onGround) {
        p.inAir = true;
        p.airTime += 1 / 60;

        // Track rotation flips in air
        const angleDiff = p.angle - p.prevAngle;
        p.accumulatedRotation += angleDiff;
        if (Math.abs(p.accumulatedRotation) >= Math.PI * 2) {
          p.flips += 1;
          p.accumulatedRotation = 0;
          playSound("flip");
          setAirTimeBonus(p.accumulatedRotation > 0 ? "⚡ Backflip! +50 Coins" : "⚡ Frontflip! +50 Coins");
          p.totalCoins += 50;
          setCoins(p.totalCoins);
          try {
            localStorage.setItem("minipokie_hillclimb_coins", String(p.totalCoins));
          } catch {}
        }
      } else {
        if (p.inAir && p.airTime > 1.2) {
          // Landed big air
          const bonus = Math.round(p.airTime * 20);
          setAirTimeBonus(`🚀 Big Air! +${bonus} Coins`);
          p.totalCoins += bonus;
          setCoins(p.totalCoins);
          try {
            localStorage.setItem("minipokie_hillclimb_coins", String(p.totalCoins));
          } catch {}
        }
        p.inAir = false;
        p.airTime = 0;
        p.accumulatedRotation = 0;
      }
      p.prevAngle = p.angle;

      // Engine Throttle & Fuel Consumption
      if (p.gas && p.fuel > 0) {
        p.fuel = Math.max(0, p.fuel - 0.075);
        if (onGround) {
          const slope = getTerrainSlope(p.x);
          p.vx += Math.cos(slope) * enginePower;
          p.vy += Math.sin(slope) * enginePower;
        } else {
          // Air Pitch Control (Tilt forward/clockwise)
          p.angularVelocity += 0.007;
        }
      }

      // Brake / Reverse
      if (p.brake) {
        if (onGround) {
          p.vx *= 0.92;
        } else {
          // Air Pitch Control (Tilt back/counter-clockwise)
          p.angularVelocity -= 0.007;
        }
      }

      // Fuel Out Check
      if (p.fuel <= 0 && Math.abs(p.vx) < 0.2) {
        setCrashReason("fuel");
        handleVehicleCrash();
        return;
      }

      // Apply Gravity
      p.vy += gravity;

      // Ground Normal Spring Suspension
      if (rearOnGround) {
        const penetration = rearWheelY - (rearGroundY - 14);
        p.vy -= penetration * suspensionStiffness;
        p.vx *= tireFriction;
      }
      if (frontOnGround) {
        const penetration = frontWheelY - (frontGroundY - 14);
        p.vy -= penetration * suspensionStiffness;
        p.vx *= tireFriction;
      }

      // Torque alignment when wheels touch terrain
      if (onGround) {
        const targetAngle = Math.atan2(frontGroundY - rearGroundY, wheelBase);
        const angleError = targetAngle - p.angle;
        p.angularVelocity += angleError * 0.18;
        p.angularVelocity *= 0.75;
      } else {
        p.angularVelocity *= 0.97;
      }

      // Integrate velocities
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.angularVelocity;

      // Air resistance
      p.vx *= 0.992;
      p.vy *= 0.992;

      // Head Crash Detection (neck snaps if driver hits ground upside down)
      const headX = p.x + Math.sin(p.angle) * 22;
      const headY = p.y - Math.cos(p.angle) * 22;
      if (headY >= getTerrainY(headX) - 4) {
        setCrashReason("neck");
        handleVehicleCrash();
        return;
      }

      // Update State Meters
      const currentDistanceMeters = Math.max(0, Math.round(p.x / 10));
      setDistance(currentDistanceMeters);
      setFuel(Math.round((p.fuel / p.maxFuel) * 100));

      // Collectibles Collision Check
      const curChunk = Math.floor(p.x / 180);
      for (let c = curChunk - 1; c <= curChunk + 2; c++) {
        if (!collectedIds.has(c)) {
          const item = getCollectible(c);
          if (item) {
            const dist = Math.hypot(p.x - item.x, p.y - item.y);
            if (dist < 36) {
              collectedIds.add(c);
              if (item.type === "coin") {
                p.coinsCollected += 1;
                p.totalCoins += 5;
                setCoins(p.totalCoins);
                playSound("coin");
                try {
                  localStorage.setItem("minipokie_hillclimb_coins", String(p.totalCoins));
                } catch {}
              } else if (item.type === "fuel") {
                p.fuel = p.maxFuel;
                playSound("fuel");
              }
            }
          }
        }
      }

      // 2. Render 60FPS Camera Follow Viewport
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Camera Offset
      const camX = p.x - w * 0.35;
      const camY = p.y - h * 0.55;

      ctx.save();
      ctx.translate(-camX, -camY);

      // Sky gradient with parallax clouds
      const skyGrad = ctx.createLinearGradient(camX, camY, camX, camY + h);
      skyGrad.addColorStop(0, "#38bdf8");
      skyGrad.addColorStop(0.6, "#bae6fd");
      skyGrad.addColorStop(1, "#f0fdf4");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX, camY, w, h);

      // Distant mountains (Parallax)
      ctx.fillStyle = "#86efac";
      ctx.beginPath();
      ctx.moveTo(camX - 50, camY + h);
      for (let x = camX - 50; x <= camX + w + 50; x += 40) {
        const mh = Math.sin(x * 0.001) * 120 + 260;
        ctx.lineTo(x, mh);
      }
      ctx.lineTo(camX + w + 50, camY + h);
      ctx.fill();

      // Foreground Hills Terrain with lush grass top
      ctx.beginPath();
      ctx.moveTo(camX - 50, camY + h + 200);
      for (let x = camX - 50; x <= camX + w + 50; x += 10) {
        ctx.lineTo(x, getTerrainY(x));
      }
      ctx.lineTo(camX + w + 50, camY + h + 200);
      ctx.closePath();

      // Dirt Fill
      ctx.fillStyle = "#78350f";
      ctx.fill();

      // Green Grass Border
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 14;
      ctx.stroke();

      // Draw Collectibles in view
      const startChunk = Math.floor((camX - 50) / 180);
      const endChunk = Math.floor((camX + w + 50) / 180);

      for (let c = startChunk; c <= endChunk; c++) {
        if (!collectedIds.has(c)) {
          const item = getCollectible(c);
          if (item) {
            if (item.type === "coin") {
              ctx.save();
              ctx.translate(item.x, item.y);
              ctx.beginPath();
              ctx.arc(0, 0, 10, 0, Math.PI * 2);
              ctx.fillStyle = "#facc15";
              ctx.fill();
              ctx.strokeStyle = "#ca8a04";
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.fillStyle = "#a16207";
              ctx.font = "bold 10px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("$", 0, 0);
              ctx.restore();
            } else if (item.type === "fuel") {
              ctx.save();
              ctx.translate(item.x, item.y);
              ctx.fillStyle = "#ef4444";
              ctx.fillRect(-10, -12, 20, 24);
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 9px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("GAS", 0, 4);
              ctx.restore();
            }
          }
        }
      }

      // 3. Draw Red Offroad Jeep Chassis & Wheels
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Chassis Red Body
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(-22, 2);
      ctx.lineTo(24, 2);
      ctx.lineTo(20, -10);
      ctx.lineTo(6, -10);
      ctx.lineTo(0, -22);
      ctx.lineTo(-20, -22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rollcage Bars
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, -22);
      ctx.lineTo(-18, 0);
      ctx.moveTo(-2, -22);
      ctx.lineTo(4, 0);
      ctx.stroke();

      // Driver Helmet & Nodding Head
      ctx.fillStyle = "#facc15"; // Yellow Helmet
      ctx.beginPath();
      ctx.arc(-8, -16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e293b"; // Visor
      ctx.fillRect(-4, -18, 5, 4);

      // Rear Wheel
      ctx.save();
      ctx.translate(-wheelBase / 2, 8);
      ctx.rotate(p.x * 0.15);
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#18181b";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Front Wheel
      ctx.save();
      ctx.translate(wheelBase / 2, 8);
      ctx.rotate(p.x * 0.15);
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#18181b";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Restore car transform
      ctx.restore(); // Restore camera transform

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, soundEnabled, upgrades, playSound]);

  const handleVehicleCrash = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playSound("crash");

    const finalMeters = Math.max(0, Math.round(physRef.current.x / 10));
    if (finalMeters > bestDistance) {
      setBestDistance(finalMeters);
      try {
        localStorage.setItem("minipokie_hillclimb_best", String(finalMeters));
      } catch {}
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Upgrade Garage Action
  const handleBuyUpgrade = (key: keyof UpgradeState) => {
    const cost = upgrades[key] * 75;
    if (coins >= cost && upgrades[key] < 5) {
      const nextCoins = coins - cost;
      const nextUpgrades = { ...upgrades, [key]: upgrades[key] + 1 };
      setCoins(nextCoins);
      setUpgrades(nextUpgrades);
      try {
        localStorage.setItem("minipokie_hillclimb_coins", String(nextCoins));
        localStorage.setItem("minipokie_hillclimb_upgrades", JSON.stringify(nextUpgrades));
      } catch {}
      playSound("coin");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Gauge className="w-4 h-4 text-emerald-500" />
            <span>Hill Climb Offroad</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Dashboard Metrics (Distance, Fuel Gauge, Coins, Record) */}
      <div className="w-full grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{distance}m</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Fuel className="w-3 h-3 text-red-500" /> Fuel
          </div>
          <div className={`text-lg font-black font-mono mt-0.5 ${fuel < 25 ? "text-rose-500 animate-pulse" : "text-slate-800 dark:text-white"}`}>
            {fuel}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coins</div>
          <div className="text-lg font-black text-yellow-500 font-mono mt-0.5">{coins} 🪙</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record</div>
          <div className="text-lg font-black text-indigo-500 font-mono mt-0.5">{bestDistance}m</div>
        </div>
      </div>

      {/* Airtime & Stunt Bonus Alert */}
      {airTimeBonus && (
        <div className="w-full py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs text-center shadow-md animate-bounce">
          {airTimeBonus}
        </div>
      )}

      {/* 60FPS Physics Canvas Viewport */}
      <div className="relative w-full aspect-[16/10] max-w-[460px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} width={460} height={280} className="w-full h-full object-cover" />

        {/* Start Driving Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Gauge className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Hill Climb Offroad</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs">
                Climb hills, collect coins & fuel, and perform stunt flips!
              </p>
            </div>
            <button
              onClick={startDrive}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 active:scale-95 transition"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Driving</span>
            </button>
          </div>
        )}

        {/* Crash / Out of Fuel Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-in zoom-in-95">
            <div className="text-3xl font-black text-rose-500">
              {crashReason === "fuel" ? "Out of Fuel!" : "Driver Neck Snap!"}
            </div>
            <p className="text-xs text-slate-300">
              Traveled: <strong className="text-white text-base">{distance}m</strong> • Total Coins: <strong className="text-yellow-400">{coins} 🪙</strong>
            </p>
            <button
              onClick={startDrive}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Drive Again</span>
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Driving Pedals (Gas & Brake) */}
      <div className="w-full max-w-[460px] grid grid-cols-2 gap-3 pt-1">
        <button
          onMouseDown={() => (physRef.current.brake = true)}
          onMouseUp={() => (physRef.current.brake = false)}
          onTouchStart={() => (physRef.current.brake = true)}
          onTouchEnd={() => (physRef.current.brake = false)}
          className="py-4 rounded-2xl bg-rose-600 active:bg-rose-700 text-white font-black text-sm flex flex-col items-center justify-center shadow-lg active:scale-95 transition select-none"
        >
          <ArrowLeft className="w-6 h-6 mb-1" />
          <span>BRAKE / REVERSE</span>
        </button>

        <button
          onMouseDown={() => (physRef.current.gas = true)}
          onMouseUp={() => (physRef.current.gas = false)}
          onTouchStart={() => (physRef.current.gas = true)}
          onTouchEnd={() => (physRef.current.gas = false)}
          className="py-4 rounded-2xl bg-emerald-600 active:bg-emerald-700 text-white font-black text-sm flex flex-col items-center justify-center shadow-lg active:scale-95 transition select-none"
        >
          <ArrowRight className="w-6 h-6 mb-1" />
          <span>GAS / THROTTLE</span>
        </button>
      </div>

      {/* Vehicle Garage Upgrade Shop */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Garage Upgrades</span>
          </div>
          <span className="text-xs text-slate-400">Coins: {coins} 🪙</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["engine", "suspension", "tires", "fuelCap"] as (keyof UpgradeState)[]).map((key) => {
            const lvl = upgrades[key];
            const cost = lvl * 75;
            const isMax = lvl >= 5;

            return (
              <button
                key={key}
                disabled={isMax || coins < cost}
                onClick={() => handleBuyUpgrade(key)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition text-left disabled:opacity-50"
              >
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">{key}</div>
                <div className="text-[10px] text-slate-400">Lvl {lvl} / 5</div>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {isMax ? "MAX" : `${cost} 🪙`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
