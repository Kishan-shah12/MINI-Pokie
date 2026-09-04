import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Download,
  Crop,
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ImageIcon,
  RefreshCw,
  Check,
  Maximize2,
  Sparkles,
} from "lucide-react";

export const ImageStudioApp: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Target Dimensions
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);

  // Filters & Adjustments
  const [brightness, setBrightness] = useState(100); // 0..200
  const [contrast, setContrast] = useState(100); // 0..200
  const [saturation, setSaturation] = useState(100); // 0..200
  const [grayscale, setGrayscale] = useState(0); // 0..100
  const [sepia, setSepia] = useState(0); // 0..100
  const [blur, setBlur] = useState(0); // 0..20px

  // Transformations
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/webp");
  const [quality, setQuality] = useState(85); // 1..100
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Handle File Load
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        imgElementRef.current = img;
        setImageSrc(result);
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
        resetAdjustments();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Reset Adjustments
  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setBlur(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // Dimension Change with Aspect Lock
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (maintainAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (maintainAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  // Process & Render to Canvas
  useEffect(() => {
    if (!imgElementRef.current || !imageSrc) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imgElementRef.current;
    const isRotated90 = rotation === 90 || rotation === 270;

    canvas.width = isRotated90 ? targetHeight : targetWidth;
    canvas.height = isRotated90 ? targetWidth : targetHeight;

    // Apply CSS filters directly to canvas context
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const drawW = isRotated90 ? targetHeight : targetWidth;
    const drawH = isRotated90 ? targetWidth : targetHeight;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export Data URL
    const q = exportFormat === "image/png" ? undefined : quality / 100;
    const dataUrl = canvas.toDataURL(exportFormat, q);
    setProcessedUrl(dataUrl);

    // Approximate size in KB
    const base64Len = dataUrl.split(",")[1]?.length || 0;
    const approxBytes = base64Len * 0.75;
    setEstimatedSizeKb(Math.round(approxBytes / 1024));
  }, [
    imageSrc,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    saturation,
    grayscale,
    sepia,
    blur,
    rotation,
    flipH,
    flipV,
    exportFormat,
    quality,
  ]);

  // Download Output
  const handleDownload = () => {
    if (!processedUrl) return;
    const ext = exportFormat === "image/jpeg" ? "jpg" : exportFormat === "image/png" ? "png" : "webp";
    const a = document.createElement("a");
    a.href = processedUrl;
    a.download = `optimized-image-${targetWidth}x${targetHeight}.${ext}`;
    a.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Image Studio & Compressor</h2>
            <p className="text-xs text-slate-400">
              Crop, resize, adjust filters, and export to WebP/PNG/JPEG entirely offline
            </p>
          </div>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Open New Image
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Image</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {!imageSrc ? (
        /* Upload Drag & Drop Box */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video max-h-[380px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70 transition flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Drag & drop an image or click to browse
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Supports PNG, JPG, WebP, SVG, and GIF. Processed securely in your browser with 0 server uploads.
          </p>
        </div>
      ) : (
        /* Active Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left Canvas Preview Area */}
          <div className="flex flex-col items-center bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="relative w-full max-h-[460px] flex items-center justify-center overflow-auto rounded-2xl bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] p-4">
              {processedUrl && (
                <img
                  src={processedUrl}
                  alt="Preview"
                  className="max-h-[400px] object-contain rounded-lg shadow-2xl transition"
                />
              )}
            </div>

            {/* Quick stats bottom bar */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 px-3 pt-3 border-t border-slate-900 mt-3">
              <span>
                Original: {originalDimensions.width} × {originalDimensions.height} px
              </span>
              <span>
                Target: {targetWidth} × {targetHeight} px
              </span>
              <span className="font-semibold text-emerald-400">
                Est. Size: {estimatedSizeKb ? `~${estimatedSizeKb} KB` : "Calculating..."}
              </span>
            </div>
          </div>

          {/* Right Adjustments & Controls Panel */}
          <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-200">
            {/* Dimensions Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dimensions (px)
                </span>
                <button
                  onClick={() => setMaintainAspect((a) => !a)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                    maintainAspect
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {maintainAspect ? "🔒 Aspect Locked" : "🔓 Free Size"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Width</label>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Height</label>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Quick Aspect Presets */}
              <div className="flex gap-1.5 mt-2">
                {[
                  { label: "1:1", w: 600, h: 600 },
                  { label: "16:9", w: 1280, h: 720 },
                  { label: "4:3", w: 800, h: 600 },
                ].map((pre) => (
                  <button
                    key={pre.label}
                    onClick={() => {
                      setTargetWidth(pre.w);
                      setTargetHeight(pre.h);
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
                  >
                    {pre.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Rotate & Flip */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Transform
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" /> 90°
                </button>
                <button
                  onClick={() => setFlipH((f) => !f)}
                  className={`py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    flipH ? "bg-cyan-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Flip X
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  className={`py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    flipV ? "bg-cyan-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" /> Flip Y
                </button>
              </div>
            </div>

            {/* Filters Sliders */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Color & Filters
                </span>
                <button
                  onClick={resetAdjustments}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Saturation</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Grayscale</span>
                  <span>{grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Export Format & Compression */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Export Format & Quality
              </span>

              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { id: "image/webp", label: "WebP (Best)" },
                  { id: "image/jpeg", label: "JPEG" },
                  { id: "image/png", label: "PNG" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`py-1.5 rounded-xl text-[11px] font-semibold transition ${
                      exportFormat === fmt.id
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {exportFormat !== "image/png" && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Quality / Compression</span>
                    <span className="font-bold text-cyan-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-1"
            >
              <Download className="w-4 h-4" />
              <span>Download Processed Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
