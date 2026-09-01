import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Code2,
  Terminal,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  CheckCircle,
  ShieldCheck,
  Wand2,
  Sliders,
  Layers,
} from "lucide-react";

type UtilityTab = "text" | "code" | "prompt";

export const AIUtilitiesApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UtilityTab>("text");

  // Text Tool State
  const [textInput, setTextInput] = useState("");
  const [textMode, setTextMode] = useState<"summarize" | "bulletize" | "formal" | "casual" | "fix-grammar" | "expand">("summarize");
  const [textOutput, setTextOutput] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textModelUsed, setTextModelUsed] = useState<string | null>(null);

  // Code Tool State
  const [codeInput, setCodeInput] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("auto");
  const [codeOutput, setCodeOutput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeModelUsed, setCodeModelUsed] = useState<string | null>(null);

  // Prompt Tool State
  const [promptInput, setPromptInput] = useState("");
  const [promptTarget, setPromptTarget] = useState("General LLM");
  const [promptOutput, setPromptOutput] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptModelUsed, setPromptModelUsed] = useState<string | null>(null);

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Text submit handler
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setTextLoading(true);
    setTextError(null);
    setTextOutput("");

    try {
      const res = await fetch("/api/ai/text-polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput, mode: textMode }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Text transformation failed.");
      }

      const data = await res.json();
      setTextOutput(data.result);
      setTextModelUsed(data.modelUsed || "Gemini Flash");
    } catch (err: any) {
      console.error(err);
      setTextError(err.message || "Failed to contact AI service.");
    } finally {
      setTextLoading(false);
    }
  };

  // Code submit handler
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;

    setCodeLoading(true);
    setCodeError(null);
    setCodeOutput("");

    try {
      const res = await fetch("/api/ai/code-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput, language: codeLanguage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Code analysis failed.");
      }

      const data = await res.json();
      setCodeOutput(data.result);
      setCodeModelUsed(data.modelUsed || "Gemini Flash");
    } catch (err: any) {
      console.error(err);
      setCodeError(err.message || "Failed to analyze code snippet.");
    } finally {
      setCodeLoading(false);
    }
  };

  // Prompt submit handler
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setPromptLoading(true);
    setPromptError(null);
    setPromptOutput("");

    try {
      const res = await fetch("/api/ai/prompt-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput, targetModel: promptTarget }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Prompt refinement failed.");
      }

      const data = await res.json();
      setPromptOutput(data.result);
      setPromptModelUsed(data.modelUsed || "Gemini Flash");
    } catch (err: any) {
      console.error(err);
      setPromptError(err.message || "Failed to refine prompt.");
    } finally {
      setPromptLoading(false);
    }
  };

  return (
    <div id="ai-utilities-app" className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI Mini Utilities Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Free, lightweight smart helpers powered by server-side Gemini with automatic model resilience.
          </p>
        </div>

        {/* Resilience Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            4-Tier Fallback Ladder Active
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "text", label: "Text Polisher & TL;DR", icon: FileText },
            { id: "code", label: "Code & Regex Explainer", icon: Code2 },
            { id: "prompt", label: "Prompt Refiner & Architect", icon: Wand2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as UtilityTab)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                  active
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. TEXT POLISHER TAB */}
      {activeTab === "text" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form onSubmit={handleTextSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Transformation Mode
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setTextInput(
                      "Mini Pokie is an open platform where developers and everyday web users can access free tools like QR generators and markdown editors, play casual arcade games, and use AI utilities without signups, cookies, or paywalls."
                    )
                  }
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Load Sample
                </button>
              </div>

              {/* Mode Select Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "summarize", label: "Summary" },
                  { id: "bulletize", label: "Bullet Points" },
                  { id: "formal", label: "Professional" },
                  { id: "casual", label: "Conversational" },
                  { id: "fix-grammar", label: "Fix Grammar" },
                  { id: "expand", label: "Elaborate" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTextMode(mode.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                      textMode === mode.id
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  id="ai-text-input"
                  rows={6}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste or write your raw text here..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={textLoading}
                  required
                />
              </div>

              {textError && (
                <p className="text-xs text-rose-500 font-medium">{textError}</p>
              )}

              <button
                id="ai-text-submit-btn"
                type="submit"
                disabled={textLoading || !textInput.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                {textLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Polishing Text...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Transform with AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Text Output Column */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-[340px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> AI Polished Output
                </span>
                {textOutput && (
                  <button
                    onClick={() => handleCopy(textOutput, "text-output")}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copied === "text-output" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "text-output" ? "Copied" : "Copy Output"}
                  </button>
                )}
              </div>

              <div className="flex-1 py-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto">
                {textOutput ? (
                  textOutput
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8">
                    <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    Enter text on the left and select your desired tone to see instant transformations.
                  </div>
                )}
              </div>

              {textModelUsed && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Engine: {textModelUsed}</span>
                  <span className="text-emerald-500 font-semibold">Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CODE EXPLAINER TAB */}
      {activeTab === "code" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form onSubmit={handleCodeSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Language / Syntax
                  </label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="TypeScript / JavaScript">TypeScript / JS</option>
                    <option value="Python">Python</option>
                    <option value="Regex">Regex Pattern</option>
                    <option value="SQL Query">SQL Query</option>
                    <option value="Rust / Go">Rust / Go</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCodeInput(
                      `const debounce = (fn, delay) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};`
                    )
                  }
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Load Sample Code
                </button>
              </div>

              <div>
                <textarea
                  id="ai-code-input"
                  rows={8}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste code snippet, regex, or query..."
                  className="w-full p-3.5 bg-slate-950 text-slate-100 font-mono text-xs border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  disabled={codeLoading}
                  spellCheck="false"
                  required
                />
              </div>

              {codeError && (
                <p className="text-xs text-rose-500 font-medium">{codeError}</p>
              )}

              <button
                id="ai-code-submit-btn"
                type="submit"
                disabled={codeLoading || !codeInput.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                {codeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Snippet...
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4" /> Explain Code & Complexity
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Code Output Column */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-[380px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-500" /> Step-by-Step Breakdown
                </span>
                {codeOutput && (
                  <button
                    onClick={() => handleCopy(codeOutput, "code-output")}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copied === "code-output" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "code-output" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <div className="flex-1 py-4 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto font-sans">
                {codeOutput ? (
                  codeOutput
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8">
                    <Code2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    Paste any code, regex pattern, or SQL query to view line-by-line explanations and complexity metrics.
                  </div>
                )}
              </div>

              {codeModelUsed && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Engine: {codeModelUsed}</span>
                  <span className="text-emerald-500 font-semibold">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PROMPT REFINER TAB */}
      {activeTab === "prompt" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form onSubmit={handlePromptSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target AI Architecture
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPromptInput("Write a landing page hero section for a privacy-first notes app with dark mode")
                  }
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Load Example Prompt
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {["General LLM", "Gemini 3 Flash", "Coding / System Prompt"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPromptTarget(t)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                      promptTarget === t
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  id="ai-prompt-input"
                  rows={6}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter a brief idea of what you want an AI to do..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={promptLoading}
                  required
                />
              </div>

              {promptError && (
                <p className="text-xs text-rose-500 font-medium">{promptError}</p>
              )}

              <button
                id="ai-prompt-submit-btn"
                type="submit"
                disabled={promptLoading || !promptInput.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                {promptLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Structuring Prompt...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Architect High-Yield Prompt
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Prompt Output Column */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-[340px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-purple-500" /> Structured System Prompt
                </span>
                {promptOutput && (
                  <button
                    onClick={() => handleCopy(promptOutput, "prompt-output")}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {copied === "prompt-output" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "prompt-output" ? "Copied" : "Copy Template"}
                  </button>
                )}
              </div>

              <div className="flex-1 py-4 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto">
                {promptOutput ? (
                  promptOutput
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-8">
                    <Wand2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    Transform vague concepts into robust, constraint-enforced system prompts ready to paste into any model.
                  </div>
                )}
              </div>

              {promptModelUsed && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Engine: {promptModelUsed}</span>
                  <span className="text-emerald-500 font-semibold">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
