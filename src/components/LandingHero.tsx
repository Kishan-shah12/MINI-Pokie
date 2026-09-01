import React from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Code2,
  Gamepad2,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface LandingHeroProps {
  onQuickLaunch: (appId: string) => void;
  totalApps: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onQuickLaunch,
  totalApps,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xs mb-8 transition-colors">
      <div className="max-w-4xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{totalApps} Modular Apps Active • No Paywalls</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-3 tracking-tight">
          One place for every small thing.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
          Free browser-based tools, tiny games, and AI utilities. No paywalls, no tracking, just utility. Modular and open source.
        </p>

        {/* Quick Launch Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-2">
            Popular:
          </span>
          <button
            onClick={() => onQuickLaunch("qrcode")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            QR Generator
          </button>
          <button
            onClick={() => onQuickLaunch("markdown")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            Markdown Editor
          </button>
          <button
            onClick={() => onQuickLaunch("2048")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            2048 Game
          </button>
          <button
            onClick={() => onQuickLaunch("snake")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            Snake Game
          </button>
          <button
            onClick={() => onQuickLaunch("quiz")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            Daily Quiz
          </button>
          <button
            onClick={() => onQuickLaunch("ai-tools")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition"
          >
            AI Summary
          </button>
        </div>
      </div>
    </div>
  );
};
