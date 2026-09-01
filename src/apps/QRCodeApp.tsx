import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Link,
  Wifi,
  Mail,
  Phone,
  User,
  FileText,
  RefreshCw,
  Palette,
  Sliders,
} from "lucide-react";

type QRType = "url" | "text" | "wifi" | "email" | "phone" | "vcard";

export const QRCodeApp: React.FC = () => {
  const [qrType, setQrType] = useState<QRType>("url");
  const [urlInput, setUrlInput] = useState("https://minipokie.dev");
  const [textInput, setTextInput] = useState("Welcome to Mini Pokie - Free open toolbox!");
  
  // WiFi
  const [wifiSsid, setWifiSsid] = useState("MyHomeNetwork");
  const [wifiPass, setWifiPass] = useState("secret123");
  const [wifiType, setWifiType] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // Email
  const [emailTo, setEmailTo] = useState("hello@example.com");
  const [emailSubject, setEmailSubject] = useState("Quick Note");
  const [emailBody, setEmailBody] = useState("Hello from Mini Pokie!");

  // Phone
  const [phoneNumber, setPhoneNumber] = useState("+1 555 019 2834");

  // vCard
  const [vcardName, setVcardName] = useState("Jane Doe");
  const [vcardOrg, setVcardOrg] = useState("Acme Labs");
  const [vcardPhone, setVcardPhone] = useState("+1 555 019 2834");
  const [vcardEmail, setVcardEmail] = useState("jane@example.com");

  // Customization
  const [fgColor, setFgColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [margin, setMargin] = useState(2);
  const [size, setSize] = useState(320);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute final payload string
  const getPayload = (): string => {
    switch (qrType) {
      case "url":
        return urlInput.trim();
      case "text":
        return textInput;
      case "wifi":
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};H:${wifiHidden ? "true" : "false"};;`;
      case "email":
        return `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        return `tel:${phoneNumber.replace(/\s+/g, "")}`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      default:
        return urlInput;
    }
  };

  const payload = getPayload();

  // Render QR to canvas
  useEffect(() => {
    if (!canvasRef.current || !payload) return;
    setError(null);

    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      },
      (err) => {
        if (err) {
          console.error("QR Code generation error:", err);
          setError("Failed to generate QR code for this payload. Try shortening text or lowering error correction.");
        }
      }
    );
  }, [payload, fgColor, bgColor, errorCorrection, margin, size, qrType]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `minipokie-qr-${qrType}-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(payload, {
        type: "svg",
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `minipokie-qr-${qrType}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      // Fallback copy text
      navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="qr-generator-container" className="max-w-6xl mx-auto space-y-6">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            QR Code Generator Studio
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create high-resolution, customized QR codes for URLs, Wi-Fi networks, contacts, and text instantly in your browser.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3 h-3" /> 100% Client-Side
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left config column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Type Selector Tabs */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {[
                { id: "url", label: "URL", icon: Link },
                { id: "text", label: "Text", icon: FileText },
                { id: "wifi", label: "Wi-Fi", icon: Wifi },
                { id: "email", label: "Email", icon: Mail },
                { id: "phone", label: "Phone", icon: Phone },
                { id: "vcard", label: "Contact", icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = qrType === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`qr-tab-${tab.id}`}
                    onClick={() => setQrType(tab.id as QRType)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form input based on QR Type */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {qrType === "url" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Website URL
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="qr-url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {qrType === "text" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Plain Text Content
                </label>
                <textarea
                  id="qr-text-input"
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter any text, code, or message..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {qrType === "wifi" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Network Name (SSID)
                  </label>
                  <input
                    id="qr-wifi-ssid"
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. CoffeeShop_Guest"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      id="qr-wifi-pass"
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Network password"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Encryption
                    </label>
                    <select
                      id="qr-wifi-encryption"
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {qrType === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Recipient Email
                  </label>
                  <input
                    id="qr-email-to"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    id="qr-email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Body Message
                  </label>
                  <textarea
                    id="qr-email-body"
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {qrType === "phone" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="qr-phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {qrType === "vcard" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Organization / Title
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Style & Error Correction Customization */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" /> Style & Design Options
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Foreground Color</span>
                  <span className="font-mono text-xs text-slate-400">{fgColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <div className="flex gap-1">
                    {["#0f172a", "#2563eb", "#7c3aed", "#059669", "#dc2626"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFgColor(color)}
                        className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Background Color</span>
                  <span className="font-mono text-xs text-slate-400">{bgColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <div className="flex gap-1">
                    {["#ffffff", "#f8fafc", "#fef08a", "#e0e7ff", "#dcfce7"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBgColor(color)}
                        className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Error Correction
                </label>
                <select
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as "L" | "M" | "Q" | "H")}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Padding (Margin)
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value={0}>0 (None)</option>
                  <option value={1}>1 (Compact)</option>
                  <option value={2}>2 (Standard)</option>
                  <option value={4}>4 (Generous)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Size (Resolution)
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value={240}>240px (Small)</option>
                  <option value={320}>320px (Medium)</option>
                  <option value={480}>480px (Large)</option>
                  <option value={640}>640px (HD)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Real-Time QR Preview
            </span>

            {/* Canvas Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center max-w-full overflow-hidden shadow-inner">
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
            </div>

            {error && (
              <p className="mt-3 text-xs text-rose-500 font-medium">{error}</p>
            )}

            {/* Quick Action buttons */}
            <div className="grid grid-cols-3 gap-2 w-full mt-6">
              <button
                id="qr-download-png"
                onClick={handleDownloadPNG}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <Download className="w-4 h-4" /> PNG
              </button>
              <button
                id="qr-download-svg"
                onClick={handleDownloadSVG}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <Download className="w-4 h-4" /> SVG
              </button>
              <button
                id="qr-copy-btn"
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 max-w-xs">
              Direct scan tested across iOS & Android cameras. No data sent to any cloud server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
