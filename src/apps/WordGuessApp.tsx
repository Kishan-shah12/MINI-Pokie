import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  BarChart2,
  Delete,
  X,
  Lightbulb,
} from "lucide-react";

// Curated 5-letter secret words pool
const TARGET_WORDS = [
  "REACT", "VIVID", "CLOUD", "SMART", "FLASH", "PIXEL", "CYBER", "GHOST",
  "LOGIC", "MAGIC", "POWER", "BRAIN", "FROST", "SPARK", "NIGHT", "DREAM",
  "OCEAN", "SOLAR", "LIGHT", "QUEST", "FLAME", "PRISM", "SWIFT", "TIGER",
  "EAGLE", "ROBOT", "SPACE", "TRACK", "STONE", "FOCUS", "STORM", "NOBLE",
  "SUPER", "CRAFT", "AUDIO", "BLOOM", "CRANE", "DELTA", "ALPHA", "CHAMP",
  "SHINE", "FRESH", "GLOWS", "HYPER", "LUCKY", "PULSE", "RAPID", "SHARP",
  "TITAN", "UNITY", "VALOR", "WORLD", "YIELD", "ZEBRA", "BEAST", "BLAZE",
];

// Generous list of accepted 5-letter words
const VALID_WORDS_SET = new Set([
  ...TARGET_WORDS,
  "ABOUT", "ABOVE", "ACTOR", "ACUTE", "ADULT", "AFTER", "AGAIN", "AGENT",
  "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIKE", "ALIVE", "ALLOW",
  "ALONE", "ALONG", "ALTER", "AMONG", "ANGER", "ANGLE", "ANGRY", "APART",
  "APPLE", "APPLY", "ARENA", "ARGUE", "ARISE", "ARRAY", "ASIDE", "ASSET",
  "AUDIO", "AUDIT", "AVOID", "AWAKE", "AWARD", "AWARE", "BADGE", "BASIC",
  "BASIS", "BEACH", "BEGAN", "BEGIN", "BEING", "BELOW", "BENCH", "BILLY",
  "BIRTH", "BLACK", "BLADE", "BLANK", "BLAST", "BLEED", "BLEND", "BLOCK",
  "BLOOD", "BOARD", "BOAST", "BOOST", "BOUND", "BREAD", "BREAK", "BREED",
  "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BUILD", "BUILT", "BUYER",
  "CABLE", "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHAOS",
  "CHARM", "CHART", "CHASE", "CHEAP", "CHECK", "CHEST", "CHIEF", "CHILD",
  "CHINA", "CHOSE", "CIVIL", "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLICK",
  "CLOCK", "CLOSE", "COACH", "COAST", "COUNT", "COURT", "COVER", "CRASH",
  "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD", "CROWN", "CRUDE", "CURVE",
  "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DEBUT", "DELAY",
  "DENSE", "DEPTH", "DIRTY", "DRAFT", "DRAIN", "DRAMA", "DRAWN", "DREAM",
  "DRESS", "DRINK", "DRIVE", "DROVE", "DYING", "EARLY", "EARTH", "EIGHT",
  "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR",
  "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT",
  "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED",
  "FLEET", "FLOOR", "FLUID", "FOCUS", "FORCE", "FORTH", "FORTY", "FORUM",
  "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FRUIT", "FULLY",
  "GIANT", "GIVEN", "GLASS", "GLOBE", "GOING", "GRACE", "GRADE", "GRAND",
  "GRANT", "GRASS", "GRAVE", "GREAT", "GREEN", "GREET", "GRIEF", "GROSS",
  "GROUP", "GROWN", "GUARD", "GUESS", "GUEST", "GUIDE", "HABIT", "HAPPY",
  "HARRY", "HARSH", "HEART", "HEAVY", "HENCE", "HORSE", "HOTEL", "HOUSE",
  "HUMAN", "IDEAL", "IMAGE", "INDEX", "INNER", "INPUT", "ISSUE", "JAPAN",
  "JIMMY", "JOINT", "JONES", "JUDGE", "KNOWN", "LABEL", "LARGE", "LASER",
  "LATER", "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL",
  "LEVEL", "LEWIS", "LIGHT", "LIMIT", "LINKS", "LIVES", "LOCAL", "LOGIC",
  "LOOSE", "LOWER", "LUCKY", "LUNCH", "LYING", "MAGIC", "MAJOR", "MAKER",
  "MARCH", "MATCH", "MAYBE", "MAYOR", "MEANT", "MEDIA", "METAL", "MIGHT",
  "MINOR", "MINUS", "MIXED", "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR",
  "MOUNT", "MOUSE", "MOUTH", "MOVIE", "MUSIC", "NEEDS", "NEVER", "NEXUS",
  "NIGHT", "NOISE", "NORTH", "NOTED", "NOVEL", "NURSE", "OCCUR", "OFFER",
  "OFTEN", "ORDER", "OTHER", "OUGHT", "PAINT", "PANEL", "PAPER", "PARTY",
  "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIECE", "PILOT", "PITCH",
  "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "POINT", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF",
  "PROUD", "PROVE", "QUEEN", "QUICK", "QUIET", "QUITE", "RADIO", "RAISE",
  "RANGE", "RAPID", "RATIO", "REACH", "READY", "REFER", "RIGHT", "RIVAL",
  "RIVER", "ROBIN", "ROGER", "ROMAN", "ROUGH", "ROUND", "ROUTE", "ROYAL",
  "RURAL", "SCALE", "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE", "SEVEN",
  "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT",
  "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN", "SIGHT", "SINCE", "SIXTH",
  "SIXTY", "SIZED", "SKILL", "SLEEP", "SLIDE", "SMALL", "SMART", "SMILE",
  "SMITH", "SMOKE", "SOLID", "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE",
  "SPARE", "SPEAK", "SPEED", "SPEND", "SPENT", "SPLIT", "SPOKE", "SPORT",
  "STAFF", "STAGE", "STAKE", "STAND", "START", "STATE", "STEAM", "STEEL",
  "STICK", "STILL", "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY",
  "STRIP", "STUDY", "STUFF", "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET",
  "TABLE", "TAKEN", "TASTE", "TAXES", "TEACH", "TEETH", "TERRY", "TEXAS",
  "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE", "THICK", "THING",
  "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "TIGHT", "TIMES",
  "TIRED", "TITLE", "TODAY", "TOPIC", "TOTAL", "TOUCH", "TOUGH", "TOWER",
  "TRACK", "TRADE", "TRAIN", "TREAT", "TREND", "TRIAL", "TRIED", "TRIES",
  "TRUCK", "TRULY", "TRUST", "TRUTH", "TWICE", "UNDER", "UNDUE", "UNION",
  "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALID",
  "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VOICE", "WASTE", "WATCH",
  "WATER", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WHOSE",
  "WOMAN", "WOMEN", "WORLD", "WORRY", "WORSE", "WORST", "WORTH", "WOULD",
  "WOUND", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOUTH",
]);

type LetterStatus = "correct" | "present" | "absent" | "empty";

interface WordleStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
}

export const WordGuessApp: React.FC = () => {
  const [targetWord, setTargetWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<WordleStats>(() => {
    try {
      const saved = localStorage.getItem("minipokie_wordle_stats");
      return saved
        ? JSON.parse(saved)
        : { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
    } catch {
      return { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
    }
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

  const playSound = useCallback((type: "key" | "delete" | "reveal" | "error" | "win" | "lose") => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "key") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "delete") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "reveal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "win") {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = "triangle";
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
          noteGain.gain.setValueAtTime(0.1, now + idx * 0.08);
          noteGain.gain.linearRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + idx * 0.08);
          noteOsc.stop(now + idx * 0.08 + 0.2);
        });
      } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Audio error ignored
    }
  }, [soundEnabled]);

  // Start new game
  const initGame = useCallback(() => {
    const randomWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setShakeRow(null);
    setToastMessage(null);
    setCopied(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Submit current guess
  const submitGuess = useCallback(() => {
    if (gameStatus !== "playing") return;

    if (currentGuess.length !== 5) {
      setShakeRow(guesses.length);
      playSound("error");
      showToast("Not enough letters");
      setTimeout(() => setShakeRow(null), 500);
      return;
    }

    const upperGuess = currentGuess.toUpperCase();
    if (!VALID_WORDS_SET.has(upperGuess)) {
      setShakeRow(guesses.length);
      playSound("error");
      showToast("Word not in dictionary");
      setTimeout(() => setShakeRow(null), 500);
      return;
    }

    const newGuesses = [...guesses, upperGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");
    playSound("reveal");

    // Win condition
    if (upperGuess === targetWord) {
      setGameStatus("won");
      playSound("win");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Update statistics
      setStats((prev) => {
        const played = prev.played + 1;
        const won = prev.won + 1;
        const currentStreak = prev.currentStreak + 1;
        const maxStreak = Math.max(prev.maxStreak, currentStreak);
        const dist = [...prev.distribution];
        dist[newGuesses.length - 1] = (dist[newGuesses.length - 1] || 0) + 1;
        const newStats = { played, won, currentStreak, maxStreak, distribution: dist };
        try {
          localStorage.setItem("minipokie_wordle_stats", JSON.stringify(newStats));
        } catch {}
        return newStats;
      });
      setTimeout(() => setShowStats(true), 1200);
      return;
    }

    // Loss condition (exceeded 6 tries)
    if (newGuesses.length === 6) {
      setGameStatus("lost");
      playSound("lose");
      showToast(`The word was: ${targetWord}`);
      setStats((prev) => {
        const played = prev.played + 1;
        const currentStreak = 0;
        const newStats = { ...prev, played, currentStreak };
        try {
          localStorage.setItem("minipokie_wordle_stats", JSON.stringify(newStats));
        } catch {}
        return newStats;
      });
      setTimeout(() => setShowStats(true), 1500);
    }
  }, [currentGuess, gameStatus, guesses, playSound, targetWord]);

  // Handle keyboard inputs
  const handleKeyInput = useCallback((key: string) => {
    if (gameStatus !== "playing") return;

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACKSPACE" || key === "DELETE") {
      setCurrentGuess((prev) => {
        if (prev.length > 0) {
          playSound("delete");
          return prev.slice(0, -1);
        }
        return prev;
      });
    } else if (/^[A-Z]$/.test(key)) {
      setCurrentGuess((prev) => {
        if (prev.length < 5) {
          playSound("key");
          return prev + key;
        }
        return prev;
      });
    }
  }, [gameStatus, playSound, submitGuess]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        handleKeyInput(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyInput]);

  // Status of each letter in a row
  const getLetterStatuses = (guess: string): LetterStatus[] => {
    const statuses: LetterStatus[] = Array(5).fill("absent");
    const targetArr = targetWord.split("");
    const guessArr = guess.split("");

    // First pass: Find exact matches (Green)
    guessArr.forEach((letter, i) => {
      if (letter === targetArr[i]) {
        statuses[i] = "correct";
        targetArr[i] = ""; // mark consumed
      }
    });

    // Second pass: Find present matches in wrong position (Yellow)
    guessArr.forEach((letter, i) => {
      if (statuses[i] !== "correct") {
        const foundIndex = targetArr.indexOf(letter);
        if (foundIndex !== -1) {
          statuses[i] = "present";
          targetArr[foundIndex] = ""; // mark consumed
        }
      }
    });

    return statuses;
  };

  // Keyboard letter color mapping
  const getKeyStatuses = (): Record<string, LetterStatus> => {
    const keyMap: Record<string, LetterStatus> = {};
    guesses.forEach((guess) => {
      const statuses = getLetterStatuses(guess);
      guess.split("").forEach((letter, i) => {
        const currentStatus = keyMap[letter];
        const newStatus = statuses[i];

        if (newStatus === "correct") {
          keyMap[letter] = "correct";
        } else if (newStatus === "present" && currentStatus !== "correct") {
          keyMap[letter] = "present";
        } else if (newStatus === "absent" && !currentStatus) {
          keyMap[letter] = "absent";
        }
      });
    });
    return keyMap;
  };

  const keyStatusMap = getKeyStatuses();

  // Share score grid
  const handleShare = () => {
    let resultGrid = `Mini Pokie Wordle ${guesses.length}/6\n\n`;
    guesses.forEach((guess) => {
      const statuses = getLetterStatuses(guess);
      statuses.forEach((s) => {
        if (s === "correct") resultGrid += "🟩";
        else if (s === "present") resultGrid += "🟨";
        else resultGrid += "⬛";
      });
      resultGrid += "\n";
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(resultGrid);
      setCopied(true);
      showToast("Result copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 flex flex-col items-center">
      {/* Top Header Card */}
      <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Wordle Arcade
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="wordle-stats-btn"
            onClick={() => setShowStats(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Statistics"
          >
            <BarChart2 className="w-4 h-4 text-indigo-500" />
          </button>

          <button
            id="wordle-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            id="wordle-reset-btn"
            onClick={initGame}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 6-Row Guess Matrix */}
      <div className="grid grid-rows-6 gap-2 select-none">
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const isCurrentRow = rowIdx === guesses.length;
          const isSubmitted = rowIdx < guesses.length;
          const guessWord = isSubmitted ? guesses[rowIdx] : isCurrentRow ? currentGuess : "";
          const statuses = isSubmitted ? getLetterStatuses(guessWord) : [];
          const isShaking = shakeRow === rowIdx;

          return (
            <div
              key={rowIdx}
              className={`grid grid-cols-5 gap-2 ${isShaking ? "animate-shake" : ""}`}
            >
              {Array.from({ length: 5 }).map((_, colIdx) => {
                const char = guessWord[colIdx] || "";
                const status = statuses[colIdx] || "empty";

                let bgClass = "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white";
                if (status === "correct") {
                  bgClass = "bg-emerald-600 border-emerald-600 text-white font-black";
                } else if (status === "present") {
                  bgClass = "bg-amber-500 border-amber-500 text-white font-black";
                } else if (status === "absent") {
                  bgClass = "bg-slate-400 dark:bg-slate-700 border-slate-400 dark:border-slate-700 text-white";
                } else if (char) {
                  bgClass = "border-slate-500 dark:border-slate-400 text-slate-900 dark:text-white scale-105";
                }

                return (
                  <div
                    key={colIdx}
                    id={`wordle-cell-${rowIdx}-${colIdx}`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200 uppercase ${bgClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Virtual On-Screen Keyboard */}
      <div className="w-full max-w-md space-y-1.5 p-2 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const status = keyStatusMap[key];
              let keyBg = "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700";
              if (status === "correct") {
                keyBg = "bg-emerald-600 text-white border-emerald-600";
              } else if (status === "present") {
                keyBg = "bg-amber-500 text-white border-amber-500";
              } else if (status === "absent") {
                keyBg = "bg-slate-300 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-transparent";
              }

              const isWide = key === "ENTER" || key === "BACKSPACE";

              return (
                <button
                  key={key}
                  id={`wordle-key-${key}`}
                  onClick={() => handleKeyInput(key)}
                  className={`h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all active:scale-95 select-none ${
                    isWide ? "px-3 sm:px-4 text-[11px]" : "w-8 sm:w-9"
                  } ${keyBg}`}
                >
                  {key === "BACKSPACE" ? <Delete className="w-4 h-4" /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Statistics
              </h3>
              <button
                onClick={() => setShowStats(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                <div className="text-lg font-black text-slate-900 dark:text-white">{stats.played}</div>
                <div className="text-[10px] text-slate-500 font-medium">Played</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Win %</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                <div className="text-lg font-black text-slate-900 dark:text-white">{stats.currentStreak}</div>
                <div className="text-[10px] text-slate-500 font-medium">Streak</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                <div className="text-lg font-black text-slate-900 dark:text-white">{stats.maxStreak}</div>
                <div className="text-[10px] text-slate-500 font-medium">Max Streak</div>
              </div>
            </div>

            {/* Guess Distribution */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Guess Distribution</div>
              {stats.distribution.map((count, idx) => {
                const maxCount = Math.max(...stats.distribution, 1);
                const pct = Math.max(8, Math.round((count / maxCount) * 100));
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-3 font-mono font-bold text-slate-500">{idx + 1}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden h-5 flex items-center">
                      <div
                        className={`h-full flex items-center justify-end px-2 text-[10px] font-bold text-white transition-all ${
                          count > 0 ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        style={{ width: `${pct}%` }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {gameStatus !== "playing" && (
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Share Result"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowStats(false);
                  initGame();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
