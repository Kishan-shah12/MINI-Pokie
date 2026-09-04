import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Code2,
  Terminal,
  Maximize2,
  Sparkles,
  Layers,
} from "lucide-react";

const DEFAULT_HTML = `<div class="card">
  <div class="glow"></div>
  <h1>Interactive Sandbox 🚀</h1>
  <p>Edit HTML, CSS, or JS in real-time to see live animations and reactive updates.</p>
  <button id="btn">Click For Particle Burst</button>
</div>`;

const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #090d16;
  font-family: system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.card {
  position: relative;
  background: #1e293b;
  padding: 2.5rem;
  border-radius: 1.5rem;
  border: 1px solid #334155;
  text-align: center;
  max-width: 380px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

button {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

button:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

button:active {
  transform: scale(0.97);
}`;

const DEFAULT_JS = `document.getElementById('btn').addEventListener('click', () => {
  const btn = document.getElementById('btn');
  btn.innerText = '⚡ Spark Fired!';
  setTimeout(() => {
    btn.innerText = 'Click For Particle Burst';
  }, 1200);
});`;

export const CodePlaygroundApp: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML);
  const [cssCode, setCssCode] = useState(DEFAULT_CSS);
  const [jsCode, setJsCode] = useState(DEFAULT_JS);

  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [copied, setCopied] = useState(false);
  const [srcDoc, setSrcDoc] = useState("");

  // Compile full iframe bundle with safe timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      const combined = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>${cssCode}</style>
          </head>
          <body>
            ${htmlCode}
            <script>
              try {
                ${jsCode}
              } catch (err) {
                console.error(err);
              }
            </script>
          </body>
        </html>
      `;
      setSrcDoc(combined);
    }, 250);

    return () => clearTimeout(timeout);
  }, [htmlCode, cssCode, jsCode]);

  const handleCopyCode = () => {
    const activeCode =
      activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode;
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([srcDoc], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "playground-project.html";
    a.click();
  };

  const handleReset = () => {
    setHtmlCode(DEFAULT_HTML);
    setCssCode(DEFAULT_CSS);
    setJsCode(DEFAULT_JS);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 select-none">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Code Playground & Web Sandbox</h2>
            <p className="text-xs text-slate-400">Live HTML, CSS & JavaScript IDE</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(["html", "css", "js"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition ${
                  activeTab === tab
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy Current Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export HTML
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Sandbox"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[460px]">
        {/* Left Code Editor Area */}
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>
              {activeTab === "html"
                ? "index.html"
                : activeTab === "css"
                ? "style.css"
                : "script.js"}
            </span>
            <span className="text-[10px] text-sky-400">Live Auto-Compile</span>
          </div>

          <textarea
            value={
              activeTab === "html"
                ? htmlCode
                : activeTab === "css"
                ? cssCode
                : jsCode
            }
            onChange={(e) => {
              const val = e.target.value;
              if (activeTab === "html") setHtmlCode(val);
              else if (activeTab === "css") setCssCode(val);
              else setJsCode(val);
            }}
            spellCheck={false}
            className="w-full flex-1 p-4 bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          />
        </div>

        {/* Right Iframe Live Preview */}
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Output
            </span>
            <span className="text-[10px] text-slate-500">Sandboxed Iframe</span>
          </div>

          <iframe
            srcDoc={srcDoc}
            title="Live Sandbox Output"
            sandbox="allow-scripts allow-modals"
            className="w-full flex-1 bg-white border-none rounded-b-3xl"
          />
        </div>
      </div>
    </div>
  );
};
