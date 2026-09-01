import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  Ruler,
  Scale,
  Thermometer,
  HardDrive,
  Gauge,
  Clock,
  Square,
  Copy,
  Check,
} from "lucide-react";

type ConverterCategory = "length" | "weight" | "temperature" | "storage" | "speed" | "time" | "area";

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const CATEGORIES: Record<ConverterCategory, { label: string; icon: React.ComponentType<{ className?: string }>; units: UnitDef[] }> = {
  length: {
    label: "Length",
    icon: Ruler,
    units: [
      { id: "m", name: "Meter", symbol: "m", toBase: (v) => v, fromBase: (v) => v },
      { id: "km", name: "Kilometer", symbol: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "cm", name: "Centimeter", symbol: "cm", toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: "mm", name: "Millimeter", symbol: "mm", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "in", name: "Inch", symbol: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: "ft", name: "Foot", symbol: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "yd", name: "Yard", symbol: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: "mi", name: "Mile", symbol: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  weight: {
    label: "Weight & Mass",
    icon: Scale,
    units: [
      { id: "kg", name: "Kilogram", symbol: "kg", toBase: (v) => v, fromBase: (v) => v },
      { id: "g", name: "Gram", symbol: "g", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "mg", name: "Milligram", symbol: "mg", toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
      { id: "lb", name: "Pound", symbol: "lb", toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: "oz", name: "Ounce", symbol: "oz", toBase: (v) => v * 0.02834952, fromBase: (v) => v / 0.02834952 },
      { id: "ton", name: "Metric Ton", symbol: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  temperature: {
    label: "Temperature",
    icon: Thermometer,
    units: [
      { id: "c", name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
      { id: "f", name: "Fahrenheit", symbol: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: "k", name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  storage: {
    label: "Digital Storage",
    icon: HardDrive,
    units: [
      { id: "b", name: "Byte", symbol: "B", toBase: (v) => v, fromBase: (v) => v },
      { id: "kb", name: "Kilobyte (KB)", symbol: "KB", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: "mb", name: "Megabyte (MB)", symbol: "MB", toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
      { id: "gb", name: "Gigabyte (GB)", symbol: "GB", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
      { id: "tb", name: "Terabyte (TB)", symbol: "TB", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
      { id: "bit", name: "Bit", symbol: "bit", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    ],
  },
  speed: {
    label: "Speed",
    icon: Gauge,
    units: [
      { id: "mps", name: "Meters / Second", symbol: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { id: "kmh", name: "Kilometers / Hour", symbol: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: "mph", name: "Miles / Hour", symbol: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: "knot", name: "Knot", symbol: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  time: {
    label: "Time",
    icon: Clock,
    units: [
      { id: "s", name: "Second", symbol: "s", toBase: (v) => v, fromBase: (v) => v },
      { id: "ms", name: "Millisecond", symbol: "ms", toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: "min", name: "Minute", symbol: "min", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: "h", name: "Hour", symbol: "hr", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: "d", name: "Day", symbol: "day", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: "w", name: "Week", symbol: "wk", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    ],
  },
  area: {
    label: "Area",
    icon: Square,
    units: [
      { id: "sqm", name: "Square Meter", symbol: "m²", toBase: (v) => v, fromBase: (v) => v },
      { id: "sqkm", name: "Square Kilometer", symbol: "km²", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: "sqft", name: "Square Foot", symbol: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: "acre", name: "Acre", symbol: "ac", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { id: "ha", name: "Hectare", symbol: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
};

export const UnitConverterApp: React.FC = () => {
  const [category, setCategory] = useState<ConverterCategory>("length");
  const [fromUnitId, setFromUnitId] = useState<string>("m");
  const [toUnitId, setToUnitId] = useState<string>("ft");
  const [inputValue, setInputValue] = useState<string>("1");
  const [copied, setCopied] = useState(false);

  const activeCategory = CATEGORIES[category];

  // Set default units when category switches
  const handleCategoryChange = (newCat: ConverterCategory) => {
    setCategory(newCat);
    const units = CATEGORIES[newCat].units;
    setFromUnitId(units[0].id);
    setToUnitId(units[1] ? units[1].id : units[0].id);
  };

  const swapUnits = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  // Convert
  const convertedValue = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return "";

    const fromDef = activeCategory.units.find((u) => u.id === fromUnitId);
    const toDef = activeCategory.units.find((u) => u.id === toUnitId);
    if (!fromDef || !toDef) return "";

    const baseVal = fromDef.toBase(num);
    const finalVal = toDef.fromBase(baseVal);

    // Format nicely without floating precision artifacts
    if (Math.abs(finalVal) < 0.000001 && finalVal !== 0) {
      return finalVal.toExponential(4);
    }
    return Number(finalVal.toFixed(6)).toString();
  }, [inputValue, fromUnitId, toUnitId, activeCategory]);

  const handleCopy = () => {
    if (!convertedValue) return;
    navigator.clipboard.writeText(convertedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="unit-converter-app" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            Universal Unit & Storage Converter
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instant bidirectional unit conversions with high precision and zero latency.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {(Object.entries(CATEGORIES) as [ConverterCategory, (typeof CATEGORIES)[ConverterCategory]][]).map(
            ([key, data]) => {
              const Icon = data.icon;
              const active = category === key;
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{data.label}</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Conversion Dual Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM Box */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              From Unit
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
              className="w-full text-2xl font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {activeCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={swapUnits}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-xs transition"
              title="Swap Units"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* TO Box */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                To Result
              </label>
              {convertedValue && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 min-h-[32px] truncate select-all">
              {convertedValue || "—"}
            </div>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {activeCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* All Other Units In Category Quick Reference */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Category Breakdown Overview
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {activeCategory.units.map((u) => {
              const num = parseFloat(inputValue);
              if (isNaN(num)) return null;
              const fromDef = activeCategory.units.find((x) => x.id === fromUnitId);
              if (!fromDef) return null;
              const converted = u.fromBase(fromDef.toBase(num));
              const displayVal = Number(converted.toFixed(4)).toString();

              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    u.id === toUnitId
                      ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{u.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {displayVal} {u.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
