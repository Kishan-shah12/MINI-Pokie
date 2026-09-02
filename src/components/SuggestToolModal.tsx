import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Plus,
  ThumbsUp,
  Search,
  CheckCircle2,
  Lightbulb,
  Wrench,
  Gamepad2,
  Bot,
  Layers,
  Send,
  Loader2,
  Flame,
  Clock,
  Check,
} from "lucide-react";

export interface ToolRequestItem {
  id: string;
  appId?: string;
  title: string;
  category: "tools" | "games" | "ai" | "other";
  description: string;
  tags: string[];
  votes: number;
  status: "Released" | "Developed" | "In Development" | "Planned" | "Under Review" | "Community Idea";
  createdAt: string;
  isUserSubmitted?: boolean;
}

const DEFAULT_WISHLIST: ToolRequestItem[] = [
  {
    id: "req-1",
    appId: "json-formatter",
    title: "JSON Formatter & Schema Validator",
    category: "tools",
    description: "Format, beautify, minify, repair syntax errors, inspect schemas, and visualize JSON in an interactive collapsible tree view.",
    tags: ["JSON", "Developer", "Formatter", "Validator"],
    votes: 48,
    status: "Released",
    createdAt: "2025-01-15",
  },
  {
    id: "req-2",
    appId: "sudoku",
    title: "Sudoku Logic Master",
    category: "games",
    description: "Classic 9x9 number puzzle with Easy to Expert difficulties, pencil notes mode, conflict highlighter, hints, and sound FX.",
    tags: ["Sudoku", "Puzzle", "Logic", "Brain"],
    votes: 45,
    status: "Released",
    createdAt: "2025-01-20",
  },
  {
    id: "req-3",
    appId: "regex-tester",
    title: "Regex Playground & Tester",
    category: "tools",
    description: "Interactive regex syntax highlighter, group matching visualizer, flags toggle, substitution preview, and cheat-sheet library.",
    tags: ["Regex", "Developer", "Testing", "Regex101"],
    votes: 39,
    status: "Released",
    createdAt: "2025-02-01",
  },
  {
    id: "req-4",
    appId: "flappy-bird",
    title: "Flappy Bird Arcade 60FPS",
    category: "games",
    description: "Smooth 60 FPS physics pipe dodger with retro arcade graphics, golden coin pickups, medals, and high score records.",
    tags: ["Retro", "Arcade", "Flappy", "Physics"],
    votes: 36,
    status: "Released",
    createdAt: "2025-02-05",
  },
  {
    id: "req-5",
    appId: "hash-encoder",
    title: "Base64 & Hash Encoder / Decoder",
    category: "tools",
    description: "Convert text & files to Base64, SHA-256 / SHA-512 / MD5 hashes, URL percent codec, Hex/Binary, and ROT13 cipher.",
    tags: ["Security", "Encoding", "Base64", "Hash"],
    votes: 34,
    status: "Released",
    createdAt: "2025-02-10",
  },
  {
    id: "req-6",
    appId: "audio-recorder",
    title: "Audio Voice Recorder & Visualizer",
    category: "tools",
    description: "In-browser voice memo recorder with live frequency equalizer & oscilloscope waveforms, playback list, and WebM export.",
    tags: ["Audio", "Microphone", "Waveform", "Recording"],
    votes: 31,
    status: "Released",
    createdAt: "2025-02-18",
  },
];

interface SuggestToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp?: (appId: string) => void;
}

export const SuggestToolModal: React.FC<SuggestToolModalProps> = ({
  isOpen,
  onClose,
  onSelectApp,
}) => {
  const [activeTab, setActiveTab] = useState<"submit" | "wishlist">("submit");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"tools" | "games" | "ai" | "other">("tools");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // AI Idea Enhancer State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  // Wishlist & Upvotes State
  const [wishlist, setWishlist] = useState<ToolRequestItem[]>(() => {
    try {
      const saved = localStorage.getItem("minipokie_community_requests_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WISHLIST;
  });

  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("minipokie_request_upvotes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistSearch, setWishlistSearch] = useState("");
  const [wishlistCategoryFilter, setWishlistCategoryFilter] = useState<string>("all");

  // Sync wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("minipokie_community_requests_v2", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Sync upvotes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("minipokie_request_upvotes", JSON.stringify(upvotedIds));
    } catch {}
  }, [upvotedIds]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newRequest: ToolRequestItem = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim() || "Community requested feature / mini application.",
      tags: tags.length > 0 ? tags : [category.toUpperCase()],
      votes: 1,
      status: "Under Review",
      createdAt: new Date().toISOString().split("T")[0],
      isUserSubmitted: true,
    };

    setWishlist((prev) => [newRequest, ...prev]);
    setUpvotedIds((prev) => [...prev, newRequest.id]);
    setSubmittedSuccess(true);

    // Reset fields after brief delay
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setTagsInput("");
      setAiSuggestions(null);
    }, 400);
  };

  const handleToggleVote = (id: string) => {
    if (upvotedIds.includes(id)) {
      setUpvotedIds((prev) => prev.filter((i) => i !== id));
      setWishlist((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, votes: Math.max(0, item.votes - 1) } : item
        )
      );
    } else {
      setUpvotedIds((prev) => [...prev, id]);
      setWishlist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
      );
    }
  };

  // AI Feature Enhancer
  const handleEnhanceWithAI = async () => {
    if (!title.trim()) return;
    setIsEnhancing(true);
    setAiSuggestions(null);

    try {
      const res = await fetch("/api/ai/suggest-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.spec) {
          setAiSuggestions(data.spec);
        } else {
          setAiSuggestions(`✨ Recommended Features for "${title.trim()}":\n• Zero-dependency client-side architecture\n• High-contrast accessible UI controls\n• LocalStorage state persistence\n• Audio effects & keyboard shortcuts`);
        }
      } else {
        // Fallback offline suggestion
        setAiSuggestions(`✨ Recommended Ideas for "${title.trim()}":\n• Fast, lightweight 1-click execution\n• Offline support with zero signups\n• Modern keyboard shortcuts and high-yield presets`);
      }
    } catch {
      setAiSuggestions(`✨ Recommended Ideas for "${title.trim()}":\n• Lightweight client-side tool with instant responsiveness\n• Clean dark/light theme support\n• LocalStorage history saving`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const filteredWishlist = wishlist.filter((item) => {
    if (wishlistCategoryFilter !== "all" && item.category !== wishlistCategoryFilter) {
      return false;
    }
    if (wishlistSearch.trim()) {
      const q = wishlistSearch.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div
      id="suggest-tool-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="suggest-tool-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggest-modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 id="suggest-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Suggest a Tool or Mini Game
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help shape the next additions to the Mini Pokie catalog
              </p>
            </div>
          </div>

          <button
            id="close-suggest-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 bg-white dark:bg-slate-900 gap-6 text-xs font-bold">
          <button
            id="tab-submit-request"
            onClick={() => {
              setActiveTab("submit");
              setSubmittedSuccess(false);
            }}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "submit"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Request New Mini App</span>
          </button>

          <button
            id="tab-wishlist"
            onClick={() => setActiveTab("wishlist")}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === "wishlist"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Community Wishlist & Upvotes ({wishlist.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "submit" ? (
            /* TAB 1: SUBMIT NEW APP REQUEST */
            submittedSuccess ? (
              <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    App Request Submitted!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Thank you! Your idea has been added to the Community Wishlist. We actively build the highest-requested utilities.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition"
                  >
                    View Community Wishlist
                  </button>
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Submit Another Idea
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* App Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    What tool or game would you like to see? *
                  </label>
                  <input
                    id="suggest-tool-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JSON Formatter, Sudoku Game, Regex Playground, Base64 Decoder..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory("tools")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        category === "tools"
                          ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5 text-blue-500" />
                      <span>⚡ Tool</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("games")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        category === "games"
                          ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-green-500" />
                      <span>🎮 Game</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("ai")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        category === "ai"
                          ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-500" />
                      <span>🤖 AI Utility</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("other")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        category === "other"
                          ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>✨ Other</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Description & Key Features (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleEnhanceWithAI}
                      disabled={!title.trim() || isEnhancing}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      )}
                      <span>AI Feature Brainstorm ✨</span>
                    </button>
                  </div>
                  <textarea
                    id="suggest-tool-desc-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe how it should work, specific features, controls, or rules you'd love to see..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* AI Suggestions Box (if generated) */}
                {aiSuggestions && (
                  <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 space-y-1.5 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Suggested Feature Concepts</span>
                    </div>
                    <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-mono">
                      {aiSuggestions}
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Keywords / Tags (Comma-separated)
                  </label>
                  <input
                    id="suggest-tool-tags-input"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Developer, Web, Security, Retro, Puzzle"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-tool-request-btn"
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* TAB 2: COMMUNITY WISHLIST & UPVOTES */
            <div className="space-y-4">
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={wishlistSearch}
                    onChange={(e) => setWishlistSearch(e.target.value)}
                    placeholder="Filter requested apps..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {["all", "tools", "games", "ai"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setWishlistCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition shrink-0 ${
                        wishlistCategoryFilter === c
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wishlist Items List */}
              <div className="space-y-2.5">
                {filteredWishlist.map((item) => {
                  const isUpvoted = upvotedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "Released" || item.status === "Developed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : item.status === "In Development"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                                : item.status === "Planned"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {item.status === "Released" || item.status === "Developed" ? "🎉 Released & Live" : item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Instant Launch Button if App is Developed/Released */}
                          {item.appId && onSelectApp && (item.status === "Released" || item.status === "Developed") && (
                            <button
                              onClick={() => {
                                onSelectApp(item.appId!);
                                onClose();
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                            >
                              <span>Launch App</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Upvote Button */}
                      <button
                        onClick={() => handleToggleVote(item.id)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[50px] p-2 rounded-xl border transition ${
                          isUpvoted
                            ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-300"
                        }`}
                        title={isUpvoted ? "Remove Upvote" : "Upvote this request"}
                      >
                        <ThumbsUp
                          className={`w-4 h-4 ${isUpvoted ? "fill-indigo-600 dark:fill-indigo-400" : ""}`}
                        />
                        <span className="text-xs font-mono font-bold mt-0.5">{item.votes}</span>
                      </button>
                    </div>
                  );
                })}

                {filteredWishlist.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No requests found matching your filter.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
