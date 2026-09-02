import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Hash,
  Binary,
  Upload,
  Layers,
  ArrowRightLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// In-browser MD5 implementation
function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let WordToHexValue = "",
      WordToHexValue_temp = "",
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }

  const x = convertToWordArray(unescape(encodeURIComponent(string)));
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

type Mode = "base64" | "hash" | "url" | "hex_binary" | "rot13";

export const HashEncoderApp: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>("base64");
  const [inputText, setInputText] = useState("Hello Mini Pokie! Welcome to high-speed client-side crypto & encoding suite.");
  const [secretKey, setSecretKey] = useState("");
  const [compareHash, setCompareHash] = useState("");
  const [caesarShift, setCaesarShift] = useState(13);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hash state
  const [hashes, setHashes] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha384: string;
    sha512: string;
  }>({ md5: "", sha1: "", sha256: "", sha384: "", sha512: "" });

  // Web Crypto Hash Calculation
  useEffect(() => {
    let isCancelled = false;

    const computeHashes = async () => {
      if (!inputText) {
        setHashes({ md5: "", sha1: "", sha256: "", sha384: "", sha512: "" });
        return;
      }

      const md5Result = md5(inputText);

      const encoder = new TextEncoder();
      const data = encoder.encode(inputText);

      const bufferToHex = (buffer: ArrayBuffer) =>
        Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      try {
        const [sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
          crypto.subtle.digest("SHA-1", data),
          crypto.subtle.digest("SHA-256", data),
          crypto.subtle.digest("SHA-384", data),
          crypto.subtle.digest("SHA-512", data),
        ]);

        if (!isCancelled) {
          setHashes({
            md5: md5Result,
            sha1: bufferToHex(sha1Buf),
            sha256: bufferToHex(sha256Buf),
            sha384: bufferToHex(sha384Buf),
            sha512: bufferToHex(sha512Buf),
          });
        }
      } catch (e) {
        if (!isCancelled) {
          setHashes({
            md5: md5Result,
            sha1: "Unsupported in this browser context",
            sha256: "Unsupported",
            sha384: "Unsupported",
            sha512: "Unsupported",
          });
        }
      }
    };

    computeHashes();
    return () => {
      isCancelled = true;
    };
  }, [inputText]);

  // Base64 computations
  const base64Encoded = useMemo(() => {
    try {
      return btoa(unescape(encodeURIComponent(inputText)));
    } catch {
      return "Invalid text for Base64 encode";
    }
  }, [inputText]);

  const base64Decoded = useMemo(() => {
    try {
      return decodeURIComponent(escape(atob(inputText.trim())));
    } catch {
      return "(Input is not valid Base64)";
    }
  }, [inputText]);

  // URL Encode/Decode
  const urlEncoded = useMemo(() => encodeURIComponent(inputText), [inputText]);
  const urlDecoded = useMemo(() => {
    try {
      return decodeURIComponent(inputText);
    } catch {
      return "(Invalid URL encoded format)";
    }
  }, [inputText]);

  // Hex and Binary
  const hexEncoded = useMemo(() => {
    return Array.from(new TextEncoder().encode(inputText))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
  }, [inputText]);

  const binaryEncoded = useMemo(() => {
    return Array.from(new TextEncoder().encode(inputText))
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(" ");
  }, [inputText]);

  // ROT13 / Caesar Cipher
  const rot13Text = useMemo(() => {
    return inputText.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + caesarShift) % 26) + base);
    });
  }, [inputText, caesarShift]);

  // Handle File to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputText(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const copyValue = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 select-none">
      {/* Navigation Mode Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMode("base64")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === "base64"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Base64</span>
          </button>

          <button
            onClick={() => setActiveMode("hash")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === "hash"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Crypto Hashes (SHA/MD5)</span>
          </button>

          <button
            onClick={() => setActiveMode("url")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === "url"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>URL Percent</span>
          </button>

          <button
            onClick={() => setActiveMode("hex_binary")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === "hex_binary"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Hex / Binary</span>
          </button>

          <button
            onClick={() => setActiveMode("rot13")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeMode === "rot13"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ROT13 / Caesar</span>
          </button>
        </div>
      </div>

      {/* Primary Input Text Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>Source Payload / Input Text</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Load File</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => setInputText("")}
              className="text-xs text-rose-500 hover:underline font-bold"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          placeholder="Type or paste payload string to encode or hash..."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
        />
      </div>

      {/* MODE 1: BASE64 VIEW */}
      {activeMode === "base64" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                🔒 Base64 Encoded Output
              </span>
              <button
                onClick={() => copyValue(base64Encoded, "b64-enc")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {copiedId === "b64-enc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-xs break-all max-h-[160px] overflow-y-auto">
              {base64Encoded}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                🔓 Base64 Decoded Text
              </span>
              <button
                onClick={() => copyValue(base64Decoded, "b64-dec")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {copiedId === "b64-dec" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-xs break-all max-h-[160px] overflow-y-auto">
              {base64Decoded}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CRYPTO HASHES VIEW */}
      {activeMode === "hash" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          {/* Checksum comparator */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Checksum Match Validator</span>
              {compareHash && (
                Object.values(hashes).includes(compareHash.trim().toLowerCase()) ? (
                  <span className="text-emerald-500 flex items-center gap-1 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Match Verified!
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1 text-[11px] font-bold">
                    <XCircle className="w-3.5 h-3.5" /> No Hash Match
                  </span>
                )
              )}
            </label>
            <input
              type="text"
              value={compareHash}
              onChange={(e) => setCompareHash(e.target.value)}
              placeholder="Paste an expected hash (MD5, SHA-256, etc.) to verify integrity..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Hashes List */}
          <div className="space-y-3">
            {[
              { label: "SHA-256 (Industry Standard)", key: "sha256", val: hashes.sha256 },
              { label: "MD5 (128-bit Checksum)", key: "md5", val: hashes.md5 },
              { label: "SHA-512 (High Security)", key: "sha512", val: hashes.sha512 },
              { label: "SHA-1 (Legacy Digest)", key: "sha1", val: hashes.sha1 },
              { label: "SHA-384", key: "sha384", val: hashes.sha384 },
            ].map((h) => {
              const isMatch = compareHash && compareHash.trim().toLowerCase() === h.val.toLowerCase();
              return (
                <div
                  key={h.key}
                  className={`p-3 rounded-xl border transition ${
                    isMatch
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-1.5">
                    <span>{h.label}</span>
                    <button
                      onClick={() => copyValue(h.val, h.key)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-500 transition"
                      title="Copy Hash"
                    >
                      {copiedId === h.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-xs break-all text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {h.val || "Computing..."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: URL PERCENT VIEW */}
      {activeMode === "url" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Encoded (%XX)</span>
              <button
                onClick={() => copyValue(urlEncoded, "url-enc")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                {copiedId === "url-enc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-xs break-all max-h-[180px] overflow-y-auto">
              {urlEncoded}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Decoded</span>
              <button
                onClick={() => copyValue(urlDecoded, "url-dec")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                {copiedId === "url-dec" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-xs break-all max-h-[180px] overflow-y-auto">
              {urlDecoded}
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: HEX & BINARY VIEW */}
      {activeMode === "hex_binary" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hexadecimal Bytes</span>
              <button
                onClick={() => copyValue(hexEncoded, "hex-enc")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                {copiedId === "hex-enc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-amber-400 p-3 rounded-xl font-mono text-xs break-all max-h-[140px] overflow-y-auto">
              {hexEncoded}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">8-Bit Binary Stream</span>
              <button
                onClick={() => copyValue(binaryEncoded, "bin-enc")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                {copiedId === "bin-enc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="bg-slate-950 text-cyan-400 p-3 rounded-xl font-mono text-xs break-all max-h-[140px] overflow-y-auto">
              {binaryEncoded}
            </div>
          </div>
        </div>
      )}

      {/* MODE 5: ROT13 / CAESAR CIPHER */}
      {activeMode === "rot13" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Caesar Shift: {caesarShift} ({caesarShift === 13 ? "Standard ROT13" : `Shift +${caesarShift}`})
            </span>
            <input
              type="range"
              min={1}
              max={25}
              value={caesarShift}
              onChange={(e) => setCaesarShift(Number(e.target.value))}
              className="w-36 accent-indigo-600"
            />
          </div>

          <div className="relative">
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs break-all max-h-[180px] overflow-y-auto">
              {rot13Text}
            </div>
            <button
              onClick={() => copyValue(rot13Text, "rot-val")}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              {copiedId === "rot-val" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
