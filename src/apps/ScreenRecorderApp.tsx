import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Mic,
  MicOff,
  Square,
  Play,
  Download,
  Camera,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  AlertCircle,
} from "lucide-react";

export const ScreenRecorderApp: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [includeMic, setIncludeMic] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Start Screen Recording
  const startRecording = async () => {
    setErrorMsg(null);
    setRecordedBlobUrl(null);
    recordedChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen recording is not supported in this browser environment.");
      }

      // 1. Get Screen Stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true, // System audio if user shares tab
      });

      // 2. Optional Mic Stream
      let combinedStream = screenStream;
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          const audioTracks = [...screenStream.getAudioTracks(), ...micStream.getAudioTracks()];
          combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioTracks,
          ]);
        } catch (micErr) {
          console.warn("Could not capture microphone audio:", micErr);
        }
      }

      streamRef.current = combinedStream;

      // When user clicks native browser "Stop sharing" button
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlobUrl(url);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.src = url;
        }
      };

      recorder.start(1000); // 1-second chunks
      setRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start screen recording:", err);
      if (err.name !== "NotAllowedError") {
        setErrorMsg(err.message || "Failed to access screen capture stream.");
      }
      setRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setRecording(false);
  };

  // Instant Screen Snapshot tool
  const takeScreenSnapshot = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen capture is not supported.");
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotUrl(dataUrl);
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        setErrorMsg(err.message || "Failed to capture snapshot.");
      }
    }
  };

  // Download Recorded Video
  const handleDownloadVideo = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement("a");
    a.href = recordedBlobUrl;
    a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
    a.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-rose-500 to-red-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Screen & Video Studio</h2>
            <p className="text-xs text-slate-400">
              Capture full screen, application windows, or browser tabs with microphone audio
            </p>
          </div>
        </div>

        {/* Quick Snapshot Action */}
        <button
          onClick={takeScreenSnapshot}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>Quick Screenshot</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Recording Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left Preview Box */}
        <div className="flex flex-col items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl min-h-[380px] justify-center relative overflow-hidden">
          {recording ? (
            /* Active Live Recording View */
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Recording Screen...</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Your screen is currently being captured. Switch to any window or tab you want to record.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-mono text-lg font-bold">
                <Clock className="w-4 h-4" />
                <span>{formatTime(recordingDuration)}</span>
              </div>
            </div>
          ) : recordedBlobUrl ? (
            /* Finished Recording Video Player */
            <div className="w-full flex flex-col items-center gap-3">
              <video
                ref={videoPreviewRef}
                src={recordedBlobUrl}
                controls
                className="w-full max-h-[380px] rounded-2xl bg-black shadow-2xl"
              />
              <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2">
                <span>Duration: {formatTime(recordingDuration)}</span>
                <span className="text-emerald-400 font-semibold">Ready to Export</span>
              </div>
            </div>
          ) : screenshotUrl ? (
            /* Screenshot Snapshot Preview */
            <div className="w-full flex flex-col items-center gap-3">
              <img
                src={screenshotUrl}
                alt="Captured Snapshot"
                className="w-full max-h-[380px] object-contain rounded-2xl shadow-2xl"
              />
              <a
                href={screenshotUrl}
                download="screenshot.png"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Screenshot PNG
              </a>
            </div>
          ) : (
            /* Idle Screen */
            <div className="flex flex-col items-center text-center p-8 text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">No Active Recording</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Configure your microphone settings on the right, then hit "Start Recording" to pick a screen, window, or Chrome tab.
              </p>
            </div>
          )}
        </div>

        {/* Right Settings & Action Bar */}
        <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Audio & Capture Options
          </span>

          {/* Microphone Toggle */}
          <button
            onClick={() => setIncludeMic((m) => !m)}
            disabled={recording}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold transition ${
              includeMic
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {includeMic ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4" />}
              <span>Microphone Voiceover</span>
            </div>
            <span className="text-[11px] font-bold">{includeMic ? "ON" : "OFF"}</span>
          </button>

          {/* Primary Record Button */}
          {!recording ? (
            <button
              onClick={startRecording}
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-red-400" />
              <span>Stop & Save Video</span>
            </button>
          )}

          {/* Download Recorded Video */}
          {recordedBlobUrl && (
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={handleDownloadVideo}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download WebM Video</span>
              </button>

              <button
                onClick={() => {
                  setRecordedBlobUrl(null);
                  setRecordingDuration(0);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
              >
                Clear Recording
              </button>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>Privacy Note:</strong> All audio and video streams are encoded locally on your machine via WebM. Nothing is ever uploaded or stored on any server.
          </div>
        </div>
      </div>
    </div>
  );
};
