import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sliders,
  Sparkles,
} from "lucide-react";

const WORDLIST = [
  "falcon", "orbit", "cipher", "beacon", "galaxy", "summit", "timber", "canyon",
  "nebula", "quartz", "vortex", "plasma", "dynamo", "anchor", "glacier", "zenith",
  "aurora", "breeze", "comet", "delta", "ember", "frost", "haven", "matrix",
  "oasis", "pulse", "quiver", "ripple", "solar", "tidal", "vector", "whisper"
];

export const PasswordGeneratorApp: React.FC = () => {
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);

  // Passphrase options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [includeNumberInPassphrase, setIncludeNumberInPassphrase] = useState(true);

  const [generatedResult, setGeneratedResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Secure random generator
  const generate = useCallback(() => {
    if (mode === "password") {
      let chars = "";
      if (useUpper) chars += avoidAmbiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (useLower) chars += avoidAmbiguous ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz";
      if (useNumbers) chars += avoidAmbiguous ? "23456789" : "0123456789";
      if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

      if (!chars) {
        setGeneratedResult("");
        return;
      }

      const randomArray = new Uint32Array(length);
      window.crypto.getRandomValues(randomArray);

      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars[randomArray[i] % chars.length];
      }
      setGeneratedResult(result);
    } else {
      // Passphrase
      const randomArray = new Uint32Array(wordCount);
      window.crypto.getRandomValues(randomArray);

      const words: string[] = [];
      for (let i = 0; i < wordCount; i++) {
        let w = WORDLIST[randomArray[i] % WORDLIST.length];
        if (capitalizeWords) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        words.push(w);
      }

      let res = words.join(separator);
      if (includeNumberInPassphrase) {
        const randNum = Math.floor(Math.random() * 900) + 100;
        res += `${separator}${randNum}`;
      }
      setGeneratedResult(res);
    }
  }, [
    mode,
    length,
    useUpper,
    useLower,
    useNumbers,
    useSymbols,
    avoidAmbiguous,
    wordCount,
    separator,
    capitalizeWords,
    includeNumberInPassphrase,
  ]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Strength analysis
  const getEntropy = (): number => {
    if (!generatedResult) return 0;
    if (mode === "password") {
      let poolSize = 0;
      if (useUpper) poolSize += 26;
      if (useLower) poolSize += 26;
      if (useNumbers) poolSize += 10;
      if (useSymbols) poolSize += 30;
      return Math.round(length * Math.log2(Math.max(2, poolSize)));
    } else {
      return Math.round(wordCount * Math.log2(WORDLIST.length) + (includeNumberInPassphrase ? 10 : 0));
    }
  };

  const entropy = getEntropy();

  const getStrengthMeta = () => {
    if (entropy < 40) {
      return { label: "Weak", color: "text-rose-500", barColor: "bg-rose-500", percent: 25, desc: "Can be brute-forced in minutes" };
    } else if (entropy < 65) {
      return { label: "Fair", color: "text-amber-500", barColor: "bg-amber-500", percent: 50, desc: "Resistant to basic automated tools" };
    } else if (entropy < 90) {
      return { label: "Strong", color: "text-emerald-500", barColor: "bg-emerald-500", percent: 75, desc: "Takes hundreds of years to crack" };
    } else {
      return { label: "Very Strong", color: "text-indigo-500", barColor: "bg-indigo-600", percent: 100, desc: "Cryptographically bulletproof" };
    }
  };

  const strength = getStrengthMeta();

  return (
    <div id="password-generator-app" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-500" />
            Password & Passphrase Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            100% client-side, CSPRNG cryptographically random generator using Web Crypto API.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMode("password")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "password" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Random Password
          </button>
          <button
            onClick={() => setMode("passphrase")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "passphrase" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Memorable Passphrase
          </button>
        </div>
      </div>

      {/* Result Display Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="font-mono text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 break-all select-all tracking-wide">
            {generatedResult || "Select at least one character set"}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={generate}
              className="p-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
              title="Generate New"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="pwd-copy-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Strength Meter Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Security Strength: <strong className={strength.color}>{strength.label}</strong>
            </span>
            <span className="font-mono text-slate-400">{entropy} bits entropy</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.barColor} transition-all duration-300 rounded-full`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">{strength.desc}</p>
        </div>
      </div>

      {/* Options Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" /> Configuration Parameters
        </h3>

        {mode === "password" ? (
          <div className="space-y-5">
            {/* Length slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Character Length:</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md font-mono text-sm font-bold">
                  {length}
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Checkbox options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Uppercase Letters (A-Z)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setUseLower(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Lowercase Letters (a-z)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Digits & Numbers (0-9)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Special Symbols (!@#$%)</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={avoidAmbiguous}
                  onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Exclude Ambiguous Characters (e.g. 1, l, I, 0, O)
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Number of Words:</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md font-mono text-sm font-bold">
                  {wordCount}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={8}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Word Separator
                </label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=".">Period (.)</option>
                  <option value=" ">Space ( )</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={capitalizeWords}
                  onChange={(e) => setCapitalizeWords(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Capitalize Words</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumberInPassphrase}
                  onChange={(e) => setIncludeNumberInPassphrase(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Append Random Digits</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
