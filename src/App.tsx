import React, { useState, useEffect, useMemo } from "react";
import { PokieApp, AppCategory } from "./types";
import { APPS_REGISTRY, getAppById } from "./registry";
import { Header } from "./components/Header";
import { AppCard } from "./components/AppCard";
import { LandingHero } from "./components/LandingHero";
import { AppViewContainer } from "./components/AppViewContainer";
import { Footer } from "./components/Footer";
import {
  Wrench,
  Gamepad2,
  Sparkles,
  SearchX,
  Zap,
  Plus,
  Compass,
  Star,
} from "lucide-react";

export const App: React.FC = () => {
  // Navigation & View State
  const [activeAppId, setActiveAppId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get("app");
    return appParam && getAppById(appParam) ? appParam : null;
  });

  const [activeCategory, setActiveCategory] = useState<AppCategory | "all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("minipokie_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("minipokie_favorites");
      return saved ? JSON.parse(saved) : ["qrcode", "snake", "ai-tools"];
    } catch {
      return ["qrcode", "snake", "ai-tools"];
    }
  });

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("minipokie_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("minipokie_theme", "light");
    }
  }, [darkMode]);

  // Sync favorites with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("minipokie_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // URL sync for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get("app");
      setActiveAppId(appParam && getAppById(appParam) ? appParam : null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLaunchApp = (appId: string) => {
    setActiveAppId(appId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const url = new URL(window.location.href);
    url.searchParams.set("app", appId);
    window.history.pushState({}, "", url.toString());
  };

  const handleBackToHub = () => {
    setActiveAppId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("app");
    window.history.pushState({}, "", url.toString());
  };

  const toggleFavorite = (appId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  // Filtered Apps Computation
  const filteredApps = useMemo(() => {
    return APPS_REGISTRY.filter((app) => {
      // Category check
      if (activeCategory === "favorites") {
        if (!favorites.includes(app.id)) return false;
      } else if (activeCategory !== "all") {
        if (app.category !== activeCategory) return false;
      }

      // Search Query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = app.title.toLowerCase().includes(q);
        const matchesDesc = app.description.toLowerCase().includes(q);
        const matchesTags = app.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesCategory = app.category.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesTags || matchesCategory;
      }

      return true;
    });
  }, [activeCategory, searchQuery, favorites]);

  const activeApp = activeAppId ? getAppById(activeAppId) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Global Navigation Header */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          if (activeAppId) handleBackToHub();
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeAppId && q) handleBackToHub();
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onHomeClick={handleBackToHub}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        {activeApp ? (
          /* ACTIVE APP VIEW */
          <AppViewContainer
            app={activeApp}
            onBack={handleBackToHub}
            onSelectApp={handleLaunchApp}
            isFavorite={favorites.includes(activeApp.id)}
            onToggleFavorite={(id) => toggleFavorite(id)}
          />
        ) : (
          /* HUB / HOMEPAGE / SEARCH RESULTS VIEW */
          <div className="space-y-6">
            {/* Show Landing Hero on home root when no search query */}
            {!searchQuery && activeCategory === "all" && (
              <LandingHero
                onQuickLaunch={handleLaunchApp}
                totalApps={APPS_REGISTRY.length}
              />
            )}

            {/* Main Split Section: Sleek Sidebar Navigation + Apps Grid */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Sleek Sidebar Category Navigation */}
              <aside className="w-full md:w-48 shrink-0 space-y-1.5 hidden md:block">
                <button
                  id="side-cat-all"
                  onClick={() => setActiveCategory("all")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2.5 ${
                    activeCategory === "all"
                      ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>All Items</span>
                </button>

                <button
                  id="side-cat-tools"
                  onClick={() => setActiveCategory("tools")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2.5 ${
                    activeCategory === "tools"
                      ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Wrench className="w-4 h-4 text-blue-500" />
                  <span>⚡ Tools</span>
                </button>

                <button
                  id="side-cat-games"
                  onClick={() => setActiveCategory("games")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2.5 ${
                    activeCategory === "games"
                      ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-green-500" />
                  <span>🎮 Games</span>
                </button>

                <button
                  id="side-cat-ai"
                  onClick={() => setActiveCategory("ai")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2.5 ${
                    activeCategory === "ai"
                      ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>🤖 AI Utils</span>
                </button>

                <button
                  id="side-cat-favorites"
                  onClick={() => setActiveCategory("favorites")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-between ${
                    activeCategory === "favorites"
                      ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Favorites</span>
                  </div>
                  {favorites.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {favorites.length}
                    </span>
                  )}
                </button>
              </aside>

              {/* Center Content: Title Info & Grid */}
              <div className="flex-1 space-y-5 w-full">
                {/* Results Title & Reset Action */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      {activeCategory === "tools" && "⚡ Tools & Utilities"}
                      {activeCategory === "games" && "🎮 Small Games"}
                      {activeCategory === "ai" && "🤖 AI Utilities"}
                      {activeCategory === "favorites" && "⭐ Saved Favorites"}
                      {activeCategory === "all" && !searchQuery && "Directory"}
                      {searchQuery && `Search Results for "${searchQuery}"`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Showing {filteredApps.length} {filteredApps.length === 1 ? "item" : "items"}
                    </p>
                  </div>

                  {(searchQuery || activeCategory !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("all");
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {/* Grid */}
                {filteredApps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onLaunch={handleLaunchApp}
                        isFavorite={favorites.includes(app.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}

                    {/* Submit a Tool Card (Matching Sleek Design) */}
                    <div
                      onClick={() => window.open("https://github.com", "_blank")}
                      className="bg-slate-100/70 dark:bg-slate-900/50 p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors min-h-[160px]"
                    >
                      <div className="w-10 h-10 border-2 border-slate-400 dark:border-slate-600 border-dashed rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-500 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Submit a Tool
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Open source module request
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto space-y-4 shadow-2xs">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                      <SearchX className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        No matching items found
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Try searching for keywords like "QR", "Snake", "Quiz", or "Password".
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("all");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      View All Items
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          if (activeAppId) handleBackToHub();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSelectApp={(appId) => {
          handleLaunchApp(appId);
        }}
      />
    </div>
  );
};
export default App;
