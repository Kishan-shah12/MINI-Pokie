import React, { useState, useMemo } from "react";
import {
  Code,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Replace,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Hash,
  Terminal,
  Layers,
  ArrowRight,
} from "lucide-react";

interface PresetPattern {
  name: string;
  category: string;
  pattern: string;
  flags: string;
  sample: string;
  description: string;
}

const PRESET_PATTERNS: PresetPattern[] = [
  {
    name: "Email Address",
    category: "Validation",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "gm",
    sample: "Contact us at support@minipokie.dev or alex.coder+test@gmail.com. Invalid: hello@domain",
    description: "Standard RFC 5322 compliant email address matcher",
  },
  {
    name: "HTTP / HTTPS URL",
    category: "Validation",
    pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    flags: "gmi",
    sample: "Visit https://minipokie.dev/apps/regex?tab=cheat or http://localhost:3000/api/v1/status.",
    description: "Matches secure and insecure web URLs with paths, queries, and ports",
  },
  {
    name: "IPv4 Address",
    category: "Network",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sample: "DNS Servers: 127.0.0.1, 192.168.1.254, 8.8.8.8, 999.300.1.1 (invalid)",
    description: "Strict octet boundary validation from 0.0.0.0 to 255.255.255.255",
  },
  {
    name: "Hex Color Code",
    category: "Design",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "gi",
    sample: "Primary theme colors: #6366f1, #06b6d4, #FFF, #10b981, and dark background #0f172a.",
    description: "Matches 3-digit and 6-digit hexadecimal RGB color codes",
  },
  {
    name: "Date (YYYY-MM-DD)",
    category: "Dates",
    pattern: "(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])",
    flags: "g",
    sample: "Project start: 2026-09-02, Release date: 2026-12-31. Invalid: 2026-13-45",
    description: "Captures year, month, and day into individual capture groups",
  },
  {
    name: "HTML / XML Tags",
    category: "Markup",
    pattern: "<([a-zA-Z0-9]+)(\\s+[^>]*?)?(?:>(.*?)<\\/\\1>|\\s*\\/>)",
    flags: "gm",
    sample: '<div class="card"><h1 id="title">Hello World</h1><img src="banner.png" /></div>',
    description: "Matches opening, closing, and self-closing HTML/XML elements with tag name & attributes",
  },
  {
    name: "Phone Number (International / US)",
    category: "Validation",
    pattern: "(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}",
    flags: "gm",
    sample: "Call support at +1 (555) 234-5678 or 555-890-1234 or +44 20 7946 0958.",
    description: "Matches US and international formatted telephone numbers",
  },
];

export const RegexTesterApp: React.FC = () => {
  const [pattern, setPattern] = useState(PRESET_PATTERNS[0].pattern);
  const [flags, setFlags] = useState(PRESET_PATTERNS[0].flags);
  const [testText, setTestText] = useState(PRESET_PATTERNS[0].sample);
  const [replaceText, setReplaceText] = useState("[$&]");
  const [mode, setMode] = useState<"match" | "replace">("match");
  const [copied, setCopied] = useState<string | null>(null);

  // Available Regex Flags
  const flagList: { flag: string; label: string; desc: string }[] = [
    { flag: "g", label: "g (global)", desc: "Find all matches rather than stopping after the first match" },
    { flag: "i", label: "i (case insensitive)", desc: "Case-insensitive matching" },
    { flag: "m", label: "m (multiline)", desc: "^ and $ match the start/end of each line" },
    { flag: "s", label: "s (dotAll)", desc: ". matches any character including newline" },
    { flag: "u", label: "u (unicode)", desc: "Treat pattern as a sequence of Unicode code points" },
  ];

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  // Compile Regex and execute matches
  const regexResult = useMemo(() => {
    if (!pattern) return { regex: null, matches: [], error: null, replaced: "" };

    try {
      const regex = new RegExp(pattern, flags);
      const matches: { match: string; index: number; groups: string[] }[] = [];

      if (flags.includes("g")) {
        let m: RegExpExecArray | null;
        let count = 0;
        // Limit to 500 matches to prevent runaway loops
        while ((m = regex.exec(testText)) !== null && count < 500) {
          matches.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
          if (m.index === regex.lastIndex) regex.lastIndex++;
          count++;
        }
      } else {
        const m = regex.exec(testText);
        if (m) {
          matches.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }

      let replaced = "";
      try {
        replaced = testText.replace(regex, replaceText);
      } catch {}

      return { regex, matches, error: null, replaced };
    } catch (err: any) {
      return { regex: null, matches: [], error: err.message, replaced: "" };
    }
  }, [pattern, flags, testText, replaceText]);

  // Highlighted Text Renderer
  const renderHighlightedText = () => {
    if (!regexResult.regex || regexResult.matches.length === 0 || regexResult.error) {
      return <span>{testText}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    regexResult.matches.forEach((m, idx) => {
      // Unmatched prefix
      if (m.index > lastIdx) {
        elements.push(
          <span key={`text-${idx}`}>{testText.slice(lastIdx, m.index)}</span>
        );
      }

      // Matched fragment with distinctive background badge
      elements.push(
        <mark
          key={`match-${idx}`}
          className="bg-amber-300 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 font-bold px-1 rounded mx-0.5 border border-amber-400 dark:border-amber-600"
          title={`Match #${idx + 1} at index ${m.index}`}
        >
          {m.match}
        </mark>
      );

      lastIdx = m.index + m.match.length;
    });

    if (lastIdx < testText.length) {
      elements.push(<span key="text-end">{testText.slice(lastIdx)}</span>);
    }

    return elements;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 select-none">
      {/* Top Header & Presets Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Terminal className="w-4 h-4 text-indigo-500" />
            <span>Regex Playground & Tester</span>
          </div>
        </div>

        {/* Preset Selector */}
        <select
          onChange={(e) => {
            const chosen = PRESET_PATTERNS.find((p) => p.name === e.target.value);
            if (chosen) {
              setPattern(chosen.pattern);
              setFlags(chosen.flags);
              setTestText(chosen.sample);
            }
          }}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          defaultValue=""
        >
          <option value="" disabled>
            📚 Quick Regex Patterns...
          </option>
          {PRESET_PATTERNS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.category})
            </option>
          ))}
        </select>
      </div>

      {/* Regex Pattern & Flags Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-500" />
            <span>Regular Expression Pattern</span>
          </label>

          {/* Mode Switch: Match vs Replace */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setMode("match")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mode === "match"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Match
            </button>
            <button
              onClick={() => setMode("replace")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mode === "replace"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Replace
            </button>
          </div>
        </div>

        {/* Expression Box with leading and trailing slash */}
        <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-3 py-1 text-slate-100 font-mono text-xs sm:text-sm">
          <span className="text-slate-500 text-lg font-bold pr-1">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression pattern..."
            className="flex-1 bg-transparent py-2.5 text-slate-100 focus:outline-none placeholder-slate-600"
            spellCheck={false}
          />
          <span className="text-slate-500 text-lg font-bold px-1">/</span>
          <span className="text-amber-400 font-bold tracking-wider">{flags}</span>
        </div>

        {/* Flag Selector Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Flags:</span>
          {flagList.map((f) => {
            const active = flags.includes(f.flag);
            return (
              <button
                key={f.flag}
                onClick={() => toggleFlag(f.flag)}
                title={f.desc}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Replacement String Input (If mode === replace) */}
      {mode === "replace" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Replace className="w-3.5 h-3.5 text-indigo-500" />
            <span>Replacement String (Supports $1, $2, $& for full match)</span>
          </label>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="e.g. [$1] or ***"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      )}

      {/* Main Workspace: Test String & Real-time Highlight Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input Test String */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Test Subject String
            </label>
            <span className="text-[11px] text-slate-400 font-mono">{testText.length} chars</span>
          </div>

          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={10}
            placeholder="Insert test text to evaluate matches..."
            className="w-full flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            spellCheck={false}
          />
        </div>

        {/* Right: Live Highlight & Replacement Preview */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{mode === "match" ? "Match Visualizer" : "Substitution Output"}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-mono">
                {regexResult.matches.length} matches
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    mode === "match" ? JSON.stringify(regexResult.matches, null, 2) : regexResult.replaced,
                    "preview"
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Copy Results"
              >
                {copied === "preview" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 p-3 text-xs font-mono leading-relaxed overflow-y-auto max-h-[320px] whitespace-pre-wrap">
            {regexResult.error ? (
              <div className="text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Regex Error: {regexResult.error}</span>
              </div>
            ) : mode === "match" ? (
              renderHighlightedText()
            ) : (
              <span>{regexResult.replaced}</span>
            )}
          </div>
        </div>
      </div>

      {/* Captured Groups Breakdown List */}
      {regexResult.matches.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Matched Details & Captured Groups</span>
            </h4>
            <span className="text-[11px] text-slate-400">Showing all captured instances</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {regexResult.matches.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-indigo-500">Match #{idx + 1}</span>
                  <span>Index {m.index}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white truncate bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  "{m.match}"
                </div>
                {m.groups.length > 0 && (
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-700/60 space-y-0.5 text-[11px]">
                    {m.groups.map((g, gi) => (
                      <div key={gi} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Group ${gi + 1}:</span>
                        <span className="text-amber-500 font-bold truncate max-w-[120px]">
                          {g !== undefined ? `"${g}"` : "undefined"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
