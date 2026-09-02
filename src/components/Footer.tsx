import React from "react";
import { Zap, ShieldCheck, Lightbulb } from "lucide-react";

interface FooterProps {
  onSelectCategory: (cat: any) => void;
  onSelectApp: (appId: string) => void;
  onOpenSuggest?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectApp,
  onOpenSuggest,
}) => {
  return (
    <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      {/* Upper directory links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                M
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Mini<span className="text-indigo-600 dark:text-indigo-400"> Pokie</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Free browser-based tools, tiny games, and AI utilities. No paywalls, no tracking, just fast, clean utility.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> No Signup Required
              </span>
              <span>•</span>
              <span>100% Free Forever</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Collections
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectCategory("tools")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ⚡ Tools & Utilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("games")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  🎮 Small Games
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("ai")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  🤖 AI Utilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("all")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ⭐ All Items
                </button>
              </li>
              {onOpenSuggest && (
                <li className="pt-1">
                  <button
                    id="footer-suggest-btn"
                    onClick={onOpenSuggest}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Suggest a Tool / Wishlist</span>
                  </button>
                </li>
              )}
            </ul>
          </div>


          {/* Featured Apps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Popular Apps
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectApp("qrcode")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  QR Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectApp("markdown")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Markdown Editor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectApp("2048")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  2048 Puzzle Arcade
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectApp("snake")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Snake Game
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectApp("quiz")}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Daily Quiz
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature Sleek Status Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            <span>&copy; {new Date().getFullYear()} Mini Pokie</span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
            <span>All-In-One Web Hub</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Systems Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
