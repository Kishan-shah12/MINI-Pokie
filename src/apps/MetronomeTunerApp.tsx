import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Music,
  Activity,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";

// Note frequencies map
const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  // Simple auto-correlation algorithm to find fundamental frequency
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet

  let r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const bufSlice = buf.slice(r1, r2);
  SIZE = bufSlice.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + bufSlice[j] * bufSlice[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1,
    maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  // Parabolic interpolation
  const x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

function getNoteAndCents(freq: number, a4 = 440) {
  const noteNum = 12 * (Math.log(freq / a4) / Math.log(2));
  const noteIndex = Math.round(noteNum) + 69;
  const noteName = NOTE_STRINGS[noteIndex % 12];
  const octave = Math.floor(noteIndex / 12) - 1;
  const targetFreq = a4 * Math.pow(2, (noteIndex - 69) / 12);
  const cents = Math.floor(1200 * (Math.log(freq / targetFreq) / Math.log(2)));
  return { noteName, octave, cents, targetFreq };
}

export const MetronomeTunerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"metronome" | "tuner">("metronome");

  // ================= METRONOME STATE =================
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const tapTimesRef = useRef<number[]>([]);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ================= TUNER STATE =================
  const [isTuning, setIsTuning] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<{
    note: string;
    octave: number;
    cents: number;
    freq: number;
  } | null>(null);
  const [a4Ref, setA4Ref] = useState(440);

  const tunerAudioCtxRef = useRef<AudioContext | null>(null);
  const tunerStreamRef = useRef<MediaStream | null>(null);
  const tunerAnimRef = useRef<number | null>(null);

  // Play click tone
  const playClick = (isAccent: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore
    }
  };

  // Metronome tick scheduler
  useEffect(() => {
    if (!isPlaying) {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    playClick(true);
    setCurrentBeat(1);

    timerIdRef.current = window.setInterval(() => {
      setCurrentBeat((prev) => {
        const next = (prev % beatsPerBar) + 1;
        playClick(next === 1);
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isPlaying, bpm, beatsPerBar]);

  // Tap Tempo Detection
  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current.filter((t) => now - t < 3000);
    taps.push(now);
    tapTimesRef.current = taps;

    if (taps.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        diffs.push(taps[i] - taps[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const calculatedBpm = Math.round(60000 / avgDiff);
      if (calculatedBpm >= 30 && calculatedBpm <= 300) {
        setBpm(calculatedBpm);
      }
    }
  };

  // ================= TUNER MICROPHONE ENGINE =================
  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tunerStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      tunerAudioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const checkPitch = () => {
        analyser.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, ctx.sampleRate);

        if (freq > 30 && freq < 2000) {
          const { noteName, octave, cents } = getNoteAndCents(freq, a4Ref);
          setDetectedPitch({
            note: noteName,
            octave,
            cents,
            freq: Math.round(freq * 10) / 10,
          });
        }

        tunerAnimRef.current = requestAnimationFrame(checkPitch);
      };

      setIsTuning(true);
      tunerAnimRef.current = requestAnimationFrame(checkPitch);
    } catch (err) {
      console.error("Failed to start tuner:", err);
      setIsTuning(false);
    }
  };

  const stopTuner = () => {
    if (tunerAnimRef.current) cancelAnimationFrame(tunerAnimRef.current);
    if (tunerStreamRef.current) {
      tunerStreamRef.current.getTracks().forEach((t) => t.stop());
      tunerStreamRef.current = null;
    }
    if (tunerAudioCtxRef.current) {
      tunerAudioCtxRef.current.close();
      tunerAudioCtxRef.current = null;
    }
    setIsTuning(false);
    setDetectedPitch(null);
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Metronome & Tuner</h2>
            <p className="text-xs text-slate-400">Audio Precision Studio</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("metronome")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === "metronome"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Metronome
          </button>
          <button
            onClick={() => setActiveTab("tuner")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === "tuner"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Tuner
          </button>
        </div>
      </div>

      {activeTab === "metronome" ? (
        /* ================= METRONOME VIEW ================= */
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
          {/* Beat Visualizer Dots */}
          <div className="flex items-center gap-3">
            {Array.from({ length: beatsPerBar }).map((_, i) => {
              const beatNum = i + 1;
              const isActive = currentBeat === beatNum && isPlaying;
              const isAccent = beatNum === 1;

              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full transition-all duration-75 flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? isAccent
                        ? "bg-amber-400 text-slate-950 scale-125 shadow-lg shadow-amber-400/50"
                        : "bg-teal-400 text-slate-950 scale-110 shadow-lg shadow-teal-400/40"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {beatNum}
                </div>
              );
            })}
          </div>

          {/* BPM Display */}
          <div className="flex flex-col items-center">
            <span className="text-6xl font-black text-white font-mono tracking-tight">{bpm}</span>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-1">
              Beats Per Minute
            </span>
          </div>

          {/* BPM Adjuster Slider & Buttons */}
          <div className="w-full flex items-center gap-4 px-4">
            <button
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="30"
              max="280"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="flex-1 accent-teal-400"
            />
            <button
              onClick={() => setBpm((b) => Math.min(280, b + 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Time Signatures & Presets */}
          <div className="flex items-center gap-2">
            {[
              { val: 2, label: "2/4" },
              { val: 3, label: "3/4" },
              { val: 4, label: "4/4" },
              { val: 6, label: "6/8" },
            ].map((ts) => (
              <button
                key={ts.val}
                onClick={() => setBeatsPerBar(ts.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  beatsPerBar === ts.val
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {ts.label}
              </button>
            ))}
          </div>

          {/* Controls: Play/Pause & Tap Tempo */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                isPlaying
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20"
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-slate-950" />}
              <span>{isPlaying ? "Stop" : "Start"}</span>
            </button>

            <button
              onClick={handleTapTempo}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              Tap Tempo
            </button>
          </div>
        </div>
      ) : (
        /* ================= TUNER VIEW ================= */
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl">
          {isTuning ? (
            <div className="flex flex-col items-center w-full">
              {/* Note Display */}
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-7xl font-black text-white">
                  {detectedPitch ? detectedPitch.note : "--"}
                </span>
                <span className="text-2xl font-bold text-teal-400">
                  {detectedPitch ? detectedPitch.octave : ""}
                </span>
              </div>

              {/* Frequency In Hz */}
              <p className="text-xs text-slate-400 font-mono mb-4">
                {detectedPitch ? `${detectedPitch.freq} Hz` : "Listening for instrument sound..."}
              </p>

              {/* Tuning Needle Gauge */}
              <div className="w-full max-w-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
                <div className="flex justify-between w-full text-[10px] text-slate-500 mb-1">
                  <span>-50 Flat</span>
                  <span className="text-teal-400 font-bold">In Tune</span>
                  <span>+50 Sharp</span>
                </div>

                {/* Gauge Bar */}
                <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center">
                  <div className="absolute w-1 h-full bg-teal-400 z-10" />
                  {detectedPitch && (
                    <div
                      className={`absolute w-3 h-3 rounded-full transition-all duration-75 ${
                        Math.abs(detectedPitch.cents) <= 4
                          ? "bg-emerald-400 shadow-md shadow-emerald-400"
                          : "bg-rose-400"
                      }`}
                      style={{
                        left: `${Math.max(0, Math.min(100, 50 + detectedPitch.cents))}%`,
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                </div>

                <span
                  className={`text-xs font-bold mt-2 ${
                    detectedPitch && Math.abs(detectedPitch.cents) <= 4
                      ? "text-emerald-400"
                      : "text-slate-300"
                  }`}
                >
                  {detectedPitch
                    ? Math.abs(detectedPitch.cents) <= 4
                      ? "PERFECT PITCH ✓"
                      : `${detectedPitch.cents > 0 ? "+" : ""}${detectedPitch.cents} cents`
                    : "Play any string"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 text-slate-400">
              <Mic className="w-12 h-12 text-teal-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Microphone Tuner</h3>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Real-time pitch detection for guitar, ukulele, violin, or voice with cent accuracy.
              </p>
            </div>
          )}

          {/* Toggle Tuner */}
          {!isTuning ? (
            <button
              onClick={startTuner}
              className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition active:scale-95 cursor-pointer"
            >
              Start Microphone Tuner
            </button>
          ) : (
            <button
              onClick={stopTuner}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              Stop Tuner
            </button>
          )}
        </div>
      )}
    </div>
  );
};
