import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  Clock,
  Activity,
  Code2,
  Quote,
  Sparkles,
  Award,
  CheckCircle2,
} from "lucide-react";

type TypingMode = "words30" | "words60" | "code" | "quotes";

interface PromptSnippet {
  title: string;
  text: string;
}

const SNIPPETS: Record<TypingMode, PromptSnippet[]> = {
  words30: [
    {
      title: "Common Speed Flow",
      text: "the quick brown fox jumps over the lazy dog while software developers build incredible tools for the modern web with speed and precision across all devices",
    },
    {
      title: "Digital Flow",
      text: "every small project starts with a single line of code and simple ideas transform into powerful web applications when passion meets consistency and clean architecture",
    },
  ],
  words60: [
    {
      title: "Developer Mastery",
      text: "in modern computing performance and accessibility go hand in hand writing clean maintainable code requires patience focus and relentless curiosity about how systems operate under the hood",
    },
    {
      title: "Future of Cloud",
      text: "distributed systems empower creators worldwide to launch serverless applications with near zero latency resilient data pipelines and delightful user experiences",
    },
  ],
  code: [
    {
      title: "JavaScript Async",
      text: "const fetchData = async (url) => { const res = await fetch(url); return await res.json(); };",
    },
    {
      title: "Python List Comp",
      text: "def filter_even(numbers): return [num for num in numbers if num % 2 == 0]",
    },
    {
      title: "React Hook",
      text: "const [state, setState] = useState(() => calculateInitialValue());",
    },
  ],
  quotes: [
    {
      title: "Steve Jobs",
      text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    },
    {
      title: "Linus Torvalds",
      text: "Talk is cheap. Show me the code. Most good programmers do programming not because they expect to get paid, but because it is fun.",
    },
  ],
};

export const TypingSprintApp: React.FC = () => {
  const [mode, setMode] = useState<TypingMode>("words30");
  const [targetText, setTargetText] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundProfile, setSoundProfile] = useState<"mechanical" | "typewriter" | "soft">("mechanical");
  const [bestWpm, setBestWpm] = useState<Record<TypingMode, number>>(() => {
    try {
      const saved = localStorage.getItem("minipokie_typing_best");
      return saved ? JSON.parse(saved) : { words30: 0, words60: 0, code: 0, quotes: 0 };
    } catch {
      return { words30: 0, words60: 0, code: 0, quotes: 0 };
    }
  });

  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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

  const playKeySound = useCallback((isError = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isError) {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        return;
      }

      if (soundProfile === "mechanical") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (soundProfile === "typewriter") {
        osc.type = "square";
        osc.frequency.setValueAtTime(350 + Math.random() * 50, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      }
    } catch {}
  }, [soundEnabled, soundProfile]);

  const initSprint = useCallback((targetMode: TypingMode) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const pool = SNIPPETS[targetMode];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setTargetText(picked.text);
    setInputVal("");
    setStartTime(null);
    setElapsedSeconds(0);
    setIsFinished(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    initSprint(mode);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, initSprint]);

  // Compute live statistics
  const charCount = inputVal.length;
  let correctChars = 0;
  let errorCount = 0;

  for (let i = 0; i < charCount; i++) {
    if (inputVal[i] === targetText[i]) {
      correctChars++;
    } else {
      errorCount++;
    }
  }

  const accuracy = charCount > 0 ? Math.max(0, Math.round((correctChars / charCount) * 100)) : 100;
  const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.01;
  const rawWpm = Math.round(charCount / 5 / minutes);
  const netWpm = Math.max(0, Math.round(correctChars / 5 / minutes));

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    const val = e.target.value;

    // Start timer on first keystroke
    if (startTime === null && val.length > 0) {
      const now = Date.now();
      setStartTime(now);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    const lastChar = val[val.length - 1];
    const expectedChar = targetText[val.length - 1];
    const isErr = val.length > 0 && lastChar !== expectedChar;
    playKeySound(isErr);

    setInputVal(val);

    // Finish test
    if (val.length >= targetText.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFinished(true);

      const finalNetWpm = Math.max(0, Math.round(correctChars / 5 / (Math.max(1, elapsedSeconds) / 60)));

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Save Best Score
      setBestWpm((prev) => {
        const current = prev[mode];
        const newBest = finalNetWpm > current ? finalNetWpm : current;
        const updated = { ...prev, [mode]: newBest };
        try {
          localStorage.setItem("minipokie_typing_best", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  const getRank = (wpm: number) => {
    if (wpm >= 90) return { label: "Godlike (S+)", color: "text-purple-600 dark:text-purple-400" };
    if (wpm >= 75) return { label: "Pro Speed (A)", color: "text-emerald-600 dark:text-emerald-400" };
    if (wpm >= 55) return { label: "Swift (B)", color: "text-blue-600 dark:text-blue-400" };
    if (wpm >= 35) return { label: "Standard (C)", color: "text-amber-600 dark:text-amber-400" };
    return { label: "Novice", color: "text-slate-500" };
  };

  const rank = getRank(netWpm);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 flex flex-col items-center">
      {/* Top Header Controls */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { key: "words30", label: "30s Sprint", icon: Clock },
            { key: "words60", label: "60s Sprint", icon: Activity },
            { key: "code", label: "Code Snippets", icon: Code2 },
            { key: "quotes", label: "Tech Quotes", icon: Quote },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.key;
            return (
              <button
                key={item.key}
                id={`typing-mode-${item.key}`}
                onClick={() => {
                  setMode(item.key as TypingMode);
                  initSprint(item.key as TypingMode);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Audio profile selector & Reset */}
        <div className="flex items-center gap-2">
          <select
            id="typing-sound-profile"
            value={soundProfile}
            onChange={(e) => setSoundProfile(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer hidden sm:block"
          >
            <option value="mechanical">Mechanical Click</option>
            <option value="typewriter">Typewriter</option>
            <option value="soft">Soft Pop</option>
          </select>

          <button
            id="typing-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="typing-reset-btn"
            onClick={() => initSprint(mode)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Live HUD Cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-indigo-500" />
            <span>Net WPM</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
            {netWpm}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            {accuracy}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timer</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-0.5 font-mono">
            {elapsedSeconds}s
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Errors</div>
          <div className={`text-2xl font-black mt-0.5 font-mono ${errorCount > 0 ? "text-rose-500" : "text-slate-400"}`}>
            {errorCount}
          </div>
        </div>
      </div>

      {/* Main Interactive Typing Arena */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative cursor-text transition-all"
      >
        {/* Hidden Real Input for Capturing Keys */}
        <input
          ref={inputRef}
          type="text"
          id="typing-hidden-input"
          value={inputVal}
          onChange={handleInputChange}
          disabled={isFinished}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Highlighted Character Stream */}
        <div className="text-lg sm:text-xl md:text-2xl leading-relaxed font-mono tracking-wide select-none">
          {targetText.split("").map((char, index) => {
            const isTyped = index < inputVal.length;
            const isCurrent = index === inputVal.length;
            const isCorrect = isTyped && inputVal[index] === char;
            const isError = isTyped && inputVal[index] !== char;

            let charClass = "text-slate-400 dark:text-slate-600";
            if (isCorrect) {
              charClass = "text-emerald-600 dark:text-emerald-400 font-bold";
            } else if (isError) {
              charClass = "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 rounded px-0.5";
            }

            return (
              <span
                key={index}
                className={`relative transition-colors ${charClass} ${
                  isCurrent ? "border-b-2 border-indigo-600 dark:border-indigo-400 animate-pulse" : ""
                }`}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Input prompt hint */}
        {inputVal.length === 0 && (
          <div className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Click here and start typing to begin timer...</span>
          </div>
        )}

        {/* Result Finish Modal / Banner */}
        {isFinished && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>Completed in {elapsedSeconds}s!</span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-extrabold bg-indigo-50 dark:bg-indigo-950/80 ${rank.color}`}>
                    {rank.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Final Speed: <strong className="text-indigo-600">{netWpm} WPM</strong> • Accuracy: <strong className="text-emerald-600">{accuracy}%</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => initSprint(mode)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Test</span>
            </button>
          </div>
        )}
      </div>

      {/* High Score Footer */}
      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Personal Best ({mode}): <strong>{bestWpm[mode]} WPM</strong></span>
        </div>
        <span>Focus on accuracy first, speed follows naturally.</span>
      </div>
    </div>
  );
};
