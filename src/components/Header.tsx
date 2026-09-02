import React from "react";
import {
  Compass,
  Search,
  Moon,
  Sun,
  Wrench,
  Gamepad2,
  Sparkles,
  Zap,
  Grid,
  Lightbulb,
} from "lucide-react";
import { AppCategory } from "../types";

interface HeaderProps {
  activeCategory: AppCategory | "all" | "favorites";
  onSelectCategory: (cat: AppCategory | "all" | "favorites") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onHomeClick: () => void;
  onOpenSuggest?: () => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  onHomeClick,
  onOpenSuggest,
  favoritesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <button
            onClick={onHomeClick}
            className="flex items-center space-x-3 text-left group focus:outline-none shrink-0"
            id="brand-logo-btn"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200/50 dark:shadow-none shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-xl tracking-tight">M</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                Mini<span className="text-indigo-600 dark:text-indigo-400"> Pokie</span>
              </h1>
            </div>
          </button>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative">
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tools & games..."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-4 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {onOpenSuggest && (
              <button
                id="header-suggest-btn"
                onClick={onOpenSuggest}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center gap-1.5 text-xs font-bold border border-amber-200/60 dark:border-amber-800/60"
                title="Suggest a new tool or mini game"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">Suggest App</span>
              </button>
            )}

            <button
              id="nav-library-btn"
              onClick={onHomeClick}
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5 text-xs font-bold"
              title="View all apps in the Library"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Library</span>
            </button>
            
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition flex items-center justify-center"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>


        {/* Mobile / Responsive Category Navigation Strip */}
        <div className="flex md:hidden items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/60">
          {[
            { id: "all", label: "All Items", icon: Compass },
            { id: "tools", label: "Tools", icon: Wrench },
            { id: "games", label: "Games", icon: Gamepad2 },
            { id: "ai", label: "AI Utils", icon: Sparkles },
            ...(favoritesCount > 0
              ? [{ id: "favorites", label: `Saved (${favoritesCount})`, icon: Zap }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                id={`cat-tab-mobile-${tab.id}`}
                onClick={() => onSelectCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
