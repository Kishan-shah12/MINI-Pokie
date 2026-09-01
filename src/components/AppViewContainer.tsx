import React, { useState } from "react";
import { PokieApp } from "../types";
import { APPS_REGISTRY } from "../registry";
import { IconRenderer } from "./IconRenderer";
import {
  ArrowLeft,
  Share2,
  Maximize2,
  Minimize2,
  Star,
  Check,
  ChevronRight,
} from "lucide-react";

interface AppViewContainerProps {
  app: PokieApp;
  onBack: () => void;
  onSelectApp: (appId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
}

export const AppViewContainer: React.FC<AppViewContainerProps> = ({
  app,
  onBack,
  onSelectApp,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const AppComponent = app.component;

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("app", app.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const otherApps = APPS_REGISTRY.filter((a) => a.id !== app.id).slice(0, 3);

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto" : ""}`}>
      {/* Navigation & Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            id="back-to-hub-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Apps</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Mini Pokie</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="capitalize">{app.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <strong className="text-slate-800 dark:text-slate-200">{app.title}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(app.id)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isFavorite
                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
            title="Toggle favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            <span className="hidden md:inline">{isFavorite ? "Saved" : "Save"}</span>
          </button>

          {/* Share */}
          <button
            id="share-app-btn"
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Share deep link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden md:inline">{copiedLink ? "Link Copied" : "Share"}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Render the Active App */}
      <div className="w-full">
        <AppComponent />
      </div>

      {/* Suggested Other Apps (when not fullscreen) */}
      {!isFullscreen && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Explore More Free Tools & Games
            </h4>
            <button
              onClick={onBack}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Browse All ({APPS_REGISTRY.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherApps.map((other) => (
              <button
                key={other.id}
                onClick={() => onSelectApp(other.id)}
                className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-2xs flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 transition-colors">
                  <IconRenderer name={other.icon || other.iconName || "Sparkles"} className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {other.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 truncate capitalize">
                    {other.category} • {other.tags[0]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
