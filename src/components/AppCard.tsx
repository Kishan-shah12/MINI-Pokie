import React from "react";
import { PokieApp } from "../types";
import { IconRenderer } from "./IconRenderer";
import { Star, ArrowRight } from "lucide-react";

interface AppCardProps {
  app: PokieApp;
  onLaunch: (appId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (appId: string, e: React.MouseEvent) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onLaunch,
  isFavorite,
  onToggleFavorite,
}) => {
  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case "Popular":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300";
      case "AI Powered":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300";
      case "Hot":
        return "bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-300";
      case "Essential":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300";
      default:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "tools":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50";
      case "games":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50";
      case "ai":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50";
      default:
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800";
    }
  };

  const getActionLabel = (cat: string) => {
    switch (cat) {
      case "games":
        return "Play Now →";
      case "ai":
        return "Launch AI →";
      default:
        return "Launch Tool →";
    }
  };

  return (
    <div
      id={`app-card-${app.id}`}
      onClick={() => onLaunch(app.id)}
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between relative"
    >
      {/* Top right badges & favorite star */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        {app.badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getBadgeStyle(
              app.badge
            )}`}
          >
            {app.badge}
          </span>
        )}

        <button
          onClick={(e) => onToggleFavorite(app.id, e)}
          className={`p-1 rounded-lg transition ${
            isFavorite
              ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60"
              : "text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={isFavorite ? "Remove from saved" : "Save for quick access"}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Main Content */}
      <div>
        <div
          className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-105 ${getCategoryColor(
            app.category
          )}`}
        >
          <IconRenderer
            name={app.icon || app.iconName || "Sparkles"}
            className="w-6 h-6"
          />
        </div>

        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {app.title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {app.description}
        </p>
      </div>

      {/* Footer trigger */}
      <div className="pt-2 flex items-center justify-between mt-auto">
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1">
          {getActionLabel(app.category)}
        </span>

        <div className="flex items-center gap-1">
          {app.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-slate-400 dark:text-slate-500 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
