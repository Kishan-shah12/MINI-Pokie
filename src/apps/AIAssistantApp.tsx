import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Code2,
  PenTool,
  GraduationCap,
  Lightbulb,
  Zap,
  Terminal,
  MessageSquare,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  timestamp: string;
}

const PERSONAS = [
  {
    id: "general",
    name: "General AI",
    icon: Sparkles,
    desc: "Helpful, precise, and multi-disciplinary assistant",
  },
  {
    id: "coder",
    name: "Code Architect",
    icon: Code2,
    desc: "Senior engineer for algorithms, bugs, and architectures",
  },
  {
    id: "copywriter",
    name: "Master Copywriter",
    icon: PenTool,
    desc: "Persuasive writing, slogans, emails, and content creation",
  },
  {
    id: "tutor",
    name: "Socratic Tutor",
    icon: GraduationCap,
    desc: "Patient educator breaking down complex concepts",
  },
  {
    id: "brainstormer",
    name: "Idea Machine",
    icon: Lightbulb,
    desc: "Unconventional brainstorming and lateral thinking",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "🐛 Debug Code Snippet",
    prompt: "Find the subtle bug in this code, explain why it fails, and provide the clean corrected version:\n\n```ts\n\n```",
  },
  {
    title: "⚡ Optimize Algorithm",
    prompt: "Analyze the time and space complexity of this function and optimize it for high performance:\n\n",
  },
  {
    title: "📝 Executive Summary",
    prompt: "Synthesize the following text into a 3-bullet executive summary with key action items:\n\n",
  },
  {
    title: "🧪 Design Unit Tests",
    prompt: "Write comprehensive unit tests with edge cases and mock assertions for:\n\n",
  },
];

export const AIAssistantApp: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your AI Assistant powered by Gemini. How can I help you build, solve, write, or brainstorm today?",
      modelUsed: "gemini-3.6-flash",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [persona, setPersona] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          persona,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "No response received.",
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Error: ${err.message || "Failed to communicate with AI server."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 h-[calc(100vh-140px)] min-h-[580px]">
      {/* Top Bar with Persona selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">AI Assistant & Playground</h2>
            <p className="text-xs text-slate-400">Gemini-Powered Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
                title={p.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.name}</span>
              </button>
            );
          })}

          <button
            onClick={() =>
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: "Chat cleared! What shall we explore next?",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ])
            }
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Box & Prompt Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 flex-1 min-h-0">
        {/* Chat History Box */}
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                        : "bg-slate-900 border border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                    <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                      <span>{m.timestamp}</span>
                      {m.modelUsed && (
                        <span className="font-mono text-purple-300/80">{m.modelUsed}</span>
                      )}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition"
                        title="Copy to Clipboard"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs animate-pulse">
                <div className="w-8 h-8 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 font-medium">Gemini is generating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Ask anything, paste code, or request creative writing..."
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold transition shadow-md active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Templates Sidebar */}
        <div className="hidden lg:flex flex-col gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-y-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Prompt Starters</span>
          </span>

          <div className="flex flex-col gap-2">
            {PROMPT_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(tmpl.prompt);
                }}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                  {tmpl.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {tmpl.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
