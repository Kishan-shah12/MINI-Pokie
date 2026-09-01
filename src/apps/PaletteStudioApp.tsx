import React, { useState, useEffect, useCallback } from "react";
import {
  Palette,
  Shuffle,
  Copy,
  Check,
  Lock,
  Unlock,
  Eye,
  Download,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ColorSlot {
  hex: string;
  locked: boolean;
}

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Calculate Relative Luminance
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Generate pleasing random hex
function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const PaletteStudioApp: React.FC = () => {
  const [colors, setColors] = useState<ColorSlot[]>([
    { hex: "#4F46E5", locked: false },
    { hex: "#06B6D4", locked: false },
    { hex: "#10B981", locked: false },
    { hex: "#F59E0B", locked: false },
    { hex: "#EC4899", locked: false },
  ]);

  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [selectedForContrast, setSelectedForContrast] = useState<{ fg: string; bg: string }>({
    fg: "#FFFFFF",
    bg: "#4F46E5",
  });

  const generateNewPalette = useCallback(() => {
    setColors((prev) =>
      prev.map((c) => (c.locked ? c : { ...c, hex: getRandomColor() }))
    );
  }, []);

  // Keyboard spacebar listener to shuffle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        generateNewPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generateNewPalette]);

  const toggleLock = (index: number) => {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleExportCSS = () => {
    const cssVars = `:root {\n${colors
      .map((c, i) => `  --color-palette-${i + 1}: ${c.hex};`)
      .join("\n")}\n}`;
    navigator.clipboard.writeText(cssVars);
    setCopiedHex("all-css");
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const contrastRatio = getContrastRatio(selectedForContrast.fg, selectedForContrast.bg);
  const passesAA = contrastRatio >= 4.5;
  const passesAAA = contrastRatio >= 7.0;
  const passesLarge = contrastRatio >= 3.0;

  return (
    <div id="palette-studio-app" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-500" />
            Color Palette & Contrast Lab
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate harmonious schemes (press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px]">Spacebar</kbd>), lock favorite hues & verify WCAG accessibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateNewPalette}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Shuffle className="w-4 h-4" /> Shuffle (Space)
          </button>
          <button
            onClick={handleExportCSS}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
          >
            {copiedHex === "all-css" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            Copy CSS
          </button>
        </div>
      </div>

      {/* Interactive Swatch Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {colors.map((color, idx) => {
          const rgb = hexToRgb(color.hex);
          const lum = getLuminance(rgb.r, rgb.g, rgb.b);
          const textDark = lum > 0.4;

          return (
            <div
              key={idx}
              className="h-44 sm:h-64 rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 relative overflow-hidden group"
              style={{ backgroundColor: color.hex }}
            >
              {/* Lock & Actions Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleLock(idx)}
                  className={`p-2 rounded-xl backdrop-blur-md transition ${
                    textDark ? "bg-black/10 hover:bg-black/20 text-slate-900" : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title={color.locked ? "Unlock color" : "Lock color"}
                >
                  {color.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 opacity-60 group-hover:opacity-100" />}
                </button>

                <button
                  onClick={() => setSelectedForContrast((prev) => ({ ...prev, bg: color.hex }))}
                  className={`p-2 rounded-xl backdrop-blur-md text-xs font-bold transition ${
                    textDark ? "bg-black/10 hover:bg-black/20 text-slate-900" : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title="Test in Contrast Lab"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Hex info */}
              <div className="space-y-1">
                <div
                  className={`font-mono text-sm font-extrabold tracking-wider ${
                    textDark ? "text-slate-950" : "text-white"
                  }`}
                >
                  {color.hex}
                </div>
                <button
                  onClick={() => handleCopy(color.hex)}
                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 backdrop-blur-md transition ${
                    textDark ? "bg-black/10 hover:bg-black/20 text-slate-900" : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                >
                  {copiedHex === color.hex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHex === color.hex ? "Copied" : "Copy Hex"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* WCAG Accessibility & Contrast Tester Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> WCAG 2.1 Contrast Checker
          </h3>
          <span className="text-xs text-slate-400 font-mono">Formula: (L1 + 0.05) / (L2 + 0.05)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Controls */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Text / Foreground Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedForContrast.fg}
                  onChange={(e) => setSelectedForContrast((prev) => ({ ...prev, fg: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={selectedForContrast.fg}
                  onChange={(e) => setSelectedForContrast((prev) => ({ ...prev, fg: e.target.value }))}
                  className="w-28 px-2.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedForContrast.bg}
                  onChange={(e) => setSelectedForContrast((prev) => ({ ...prev, bg: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={selectedForContrast.bg}
                  onChange={(e) => setSelectedForContrast((prev) => ({ ...prev, bg: e.target.value }))}
                  className="w-28 px-2.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="md:col-span-4">
            <div
              className="p-6 rounded-2xl border shadow-inner flex flex-col justify-center text-center space-y-2 min-h-[140px]"
              style={{ backgroundColor: selectedForContrast.bg, color: selectedForContrast.fg }}
            >
              <span className="text-xs uppercase tracking-widest font-bold opacity-80">Sample Typography</span>
              <p className="text-base font-bold">The quick brown fox jumps over the lazy dog.</p>
              <p className="text-xs opacity-75">16px body copy preview rendering.</p>
            </div>
          </div>

          {/* Results Rating Score */}
          <div className="md:col-span-3 space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Contrast Ratio</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {contrastRatio.toFixed(2)}:1
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span>AA Normal (4.5:1)</span>
                {passesAA ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pass</span>
                ) : (
                  <span className="text-rose-500 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Fail</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>AAA Normal (7:1)</span>
                {passesAAA ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pass</span>
                ) : (
                  <span className="text-rose-500 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Fail</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>AA Large (3:1)</span>
                {passesLarge ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Pass</span>
                ) : (
                  <span className="text-rose-500 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Fail</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
