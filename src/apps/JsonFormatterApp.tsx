import React, { useState, useMemo } from "react";
import {
  Code,
  Copy,
  Check,
  Download,
  Trash2,
  FileCode,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileJson,
  Wrench,
} from "lucide-react";

const SAMPLE_JSONS: Record<string, string> = {
  "API Response": JSON.stringify(
    {
      status: 200,
      success: true,
      message: "Data retrieved successfully",
      timestamp: "2026-09-02T12:00:00Z",
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 42,
        totalPages: 5,
      },
      data: [
        {
          id: "usr_9981",
          username: "alex_coder",
          email: "alex@example.com",
          role: "admin",
          verified: true,
          tags: ["developer", "reviewer", "vip"],
          stats: { loginCount: 142, repScore: 98.4 },
        },
        {
          id: "usr_9982",
          username: "sarah_design",
          email: "sarah@example.com",
          role: "editor",
          verified: true,
          tags: ["ui/ux", "graphics"],
          stats: { loginCount: 89, repScore: 92.1 },
        },
      ],
    },
    null,
    2
  ),
  "E-Commerce Order": JSON.stringify(
    {
      orderId: "ORD-2026-8819",
      customer: {
        name: "Elena Rostova",
        email: "elena@store.com",
        address: {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          state: "OR",
          postalCode: "97477",
          country: "USA",
        },
      },
      items: [
        { sku: "KB-MECH-01", title: "Wireless Mechanical Keyboard", quantity: 1, unitPrice: 129.99 },
        { sku: "MS-ERG-02", title: "Ergonomic Precision Mouse", quantity: 2, unitPrice: 49.5 },
      ],
      discountCode: "MINIPOKIE20",
      subtotal: 228.99,
      discount: 45.8,
      shipping: 0.0,
      total: 183.19,
      paid: true,
    },
    null,
    2
  ),
  "Server Config": JSON.stringify(
    {
      app: {
        name: "MiniPokieHub",
        version: "2.4.0",
        environment: "production",
        port: 3000,
        cors: {
          origins: ["https://minipokie.dev", "https://app.minipokie.dev"],
          methods: ["GET", "POST", "PUT", "DELETE"],
          credentials: true,
        },
        rateLimiting: {
          windowMs: 60000,
          maxRequests: 120,
        },
        features: {
          enableAiAssistant: true,
          enableOfflinePwa: true,
          enableAnalytics: false,
        },
      },
    },
    null,
    2
  ),
};

// Tree Item Recursive Component
const JsonTreeNode: React.FC<{
  nodeKey: string | number;
  value: any;
  searchTerm: string;
  depth?: number;
}> = ({ nodeKey, value, searchTerm, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isContainer = isObject || isArray;

  // Search matching
  const keyMatches = searchTerm && String(nodeKey).toLowerCase().includes(searchTerm.toLowerCase());
  const valueMatches =
    searchTerm && !isContainer && String(value).toLowerCase().includes(searchTerm.toLowerCase());

  const highlightClass = keyMatches || valueMatches ? "bg-yellow-200 dark:bg-yellow-900/60 font-bold" : "";

  if (!isContainer) {
    let typeColor = "text-emerald-600 dark:text-emerald-400";
    let displayVal = JSON.stringify(value);

    if (typeof value === "number") {
      typeColor = "text-amber-600 dark:text-amber-400";
    } else if (typeof value === "boolean") {
      typeColor = "text-indigo-600 dark:text-indigo-400";
    } else if (value === null) {
      typeColor = "text-rose-500";
    }

    return (
      <div className={`flex items-center gap-2 py-0.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 font-mono text-xs ${highlightClass}`}>
        <span className="text-slate-500 dark:text-slate-400 font-semibold">{nodeKey}:</span>
        <span className={`${typeColor} break-all`}>{displayVal}</span>
      </div>
    );
  }

  const count = isArray ? value.length : Object.keys(value).length;
  const badgeLabel = isArray ? `[${count}]` : `{${count}}`;

  return (
    <div className="py-0.5">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-mono text-xs select-none ${highlightClass}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className="font-bold text-slate-800 dark:text-slate-200">{nodeKey}:</span>
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {badgeLabel}
        </span>
      </div>

      {isExpanded && (
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 mt-0.5">
          {isArray
            ? value.map((item, idx) => (
                <JsonTreeNode
                  key={idx}
                  nodeKey={idx}
                  value={item}
                  searchTerm={searchTerm}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value).map(([k, v]) => (
                <JsonTreeNode
                  key={k}
                  nodeKey={k}
                  value={v}
                  searchTerm={searchTerm}
                  depth={depth + 1}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export const JsonFormatterApp: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSONS["API Response"]);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [viewMode, setViewMode] = useState<"code" | "tree">("code");
  const [copied, setCopied] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [autoFixMessage, setAutoFixMessage] = useState<string | null>(null);

  // Parse & Validate
  const parseResult = useMemo(() => {
    if (!inputJson.trim()) {
      return { parsed: null, error: null, stats: null };
    }
    try {
      const parsed = JSON.parse(inputJson);
      const text = JSON.stringify(parsed);
      const keysCount = (inputJson.match(/"[^"]+"\s*:/g) || []).length;
      const sizeBytes = new Blob([inputJson]).size;

      // Calculate depth
      const getDepth = (obj: any): number => {
        if (typeof obj !== "object" || obj === null) return 0;
        return 1 + Math.max(0, ...Object.values(obj).map(getDepth));
      };

      return {
        parsed,
        error: null,
        stats: {
          sizeFormatted: sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`,
          keysCount,
          depth: getDepth(parsed),
          isArray: Array.isArray(parsed),
        },
      };
    } catch (err: any) {
      return {
        parsed: null,
        error: err.message || "Invalid JSON syntax",
        stats: null,
      };
    }
  }, [inputJson]);

  // Actions
  const handleBeautify = (spaces: number = indentSize) => {
    try {
      const obj = JSON.parse(inputJson);
      setInputJson(JSON.stringify(obj, null, spaces));
      setAutoFixMessage(null);
    } catch {
      handleAutoFix();
    }
  };

  const handleMinify = () => {
    try {
      const obj = JSON.parse(inputJson);
      setInputJson(JSON.stringify(obj));
      setAutoFixMessage(null);
    } catch {
      handleAutoFix();
    }
  };

  // Auto-Repair common malformed JSON issues
  const handleAutoFix = () => {
    let fixed = inputJson;
    try {
      // 1. Replace single quotes with double quotes around keys and values
      fixed = fixed.replace(/'/g, '"');
      // 2. Quote unquoted keys (e.g. { foo: 123 } -> { "foo": 123 })
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
      // 3. Strip trailing commas before } or ]
      fixed = fixed.replace(/,\s*([}\]])/g, "$1");

      const obj = JSON.parse(fixed);
      setInputJson(JSON.stringify(obj, null, indentSize));
      setAutoFixMessage("✨ Successfully repaired single-quotes & unquoted keys!");
    } catch (e: any) {
      setAutoFixMessage("⚠️ Could not automatically repair this JSON. Please inspect the syntax error below.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([inputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInputJson("");
    setAutoFixMessage(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Presets & View Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("code")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "code"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              disabled={!parseResult.parsed}
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 ${
                viewMode === "tree"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Interactive Tree</span>
            </button>
          </div>

          {/* Sample Presets Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value && SAMPLE_JSONS[e.target.value]) {
                setInputJson(SAMPLE_JSONS[e.target.value]);
                setAutoFixMessage(null);
              }
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Load Sample Data...
            </option>
            {Object.keys(SAMPLE_JSONS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleBeautify(indentSize)}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beautify</span>
          </button>

          <button
            onClick={handleMinify}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>

          <button
            onClick={handleAutoFix}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition"
            title="Fix unquoted keys, single quotes, and trailing commas"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Auto Fix</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Copy JSON"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            title="Download .json"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto Repair Notice */}
      {autoFixMessage && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>{autoFixMessage}</span>
          <button onClick={() => setAutoFixMessage(null)} className="text-amber-500 hover:text-amber-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="grid grid-cols-1 gap-4">
        {viewMode === "code" ? (
          <div className="relative">
            <textarea
              value={inputJson}
              onChange={(e) => {
                setInputJson(e.target.value);
                setAutoFixMessage(null);
              }}
              placeholder="Paste or type raw JSON here..."
              rows={18}
              className="w-full bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm p-4 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y shadow-inner"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Interactive Tree View */
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 min-h-[420px] max-h-[600px] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Filter keys or values..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Click node to expand/collapse</span>
            </div>

            {parseResult.parsed ? (
              <div className="space-y-1">
                <JsonTreeNode nodeKey="root" value={parseResult.parsed} searchTerm={treeSearch} depth={0} />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No valid JSON to render in tree view.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status & Stats Footer */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {parseResult.error ? (
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseResult.error}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Valid JSON Structure</span>
          </div>
        )}

        {parseResult.stats && (
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <span>Size: <strong className="text-slate-800 dark:text-white">{parseResult.stats.sizeFormatted}</strong></span>
            <span>Keys: <strong className="text-slate-800 dark:text-white">{parseResult.stats.keysCount}</strong></span>
            <span>Depth: <strong className="text-slate-800 dark:text-white">{parseResult.stats.depth}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
