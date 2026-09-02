import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Volume2,
  Activity,
  Radio,
  FileAudio,
  Sparkles,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react";

interface RecordedAudio {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
  timestamp: string;
  name: string;
}

export const AudioRecorderApp: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<"bars" | "wave">("bars");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Duration timer
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Draw Audio Visualizer Loop
  const startVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (visualizerMode === "bars") {
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height - 20);

          const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
          grad.addColorStop(0, "#6366f1");
          grad.addColorStop(0.5, "#818cf8");
          grad.addColorStop(1, "#38bdf8");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
        }
      } else {
        // Oscilloscope Waveform Mode
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    draw();
  }, [visualizerMode]);

  // Start Voice Recording
  const startRecording = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // Recorder Setup
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newRec: RecordedAudio = {
          id: `rec-${Date.now()}`,
          url: audioUrl,
          blob: audioBlob,
          duration: recordDuration,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          name: `Voice_Memo_${recordings.length + 1}`,
        };

        setRecordings((prev) => [newRec, ...prev]);
        setRecordDuration(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);
      startVisualizer();
    } catch (err: any) {
      setPermissionError(
        "Microphone access was denied or not available. Please allow microphone permissions in your browser to record audio."
      );
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Pause / Resume
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Playback handlers
  const handlePlayToggle = (rec: RecordedAudio) => {
    if (activePlayingId === rec.id) {
      audioElementsRef.current[rec.id]?.pause();
      setActivePlayingId(null);
    } else {
      // Pause any currently playing
      if (activePlayingId && audioElementsRef.current[activePlayingId]) {
        audioElementsRef.current[activePlayingId].pause();
      }

      if (!audioElementsRef.current[rec.id]) {
        const audio = new Audio(rec.url);
        audio.onended = () => setActivePlayingId(null);
        audioElementsRef.current[rec.id] = audio;
      }

      audioElementsRef.current[rec.id].play();
      setActivePlayingId(rec.id);
    }
  };

  const handleDelete = (id: string) => {
    if (activePlayingId === id && audioElementsRef.current[id]) {
      audioElementsRef.current[id].pause();
      setActivePlayingId(null);
    }
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownload = (rec: RecordedAudio) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = `${rec.name}.webm`;
    a.click();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none">
      {/* Top Header & Visualizer Mode */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 dark:text-white">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Voice Recorder & Spectrum Visualizer</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setVisualizerMode("bars")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              visualizerMode === "bars"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Equalizer</span>
          </button>

          <button
            onClick={() => setVisualizerMode("wave")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              visualizerMode === "wave"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Waveform</span>
          </button>
        </div>
      </div>

      {/* Permission Warning */}
      {permissionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Live Audio Visualizer Canvas Screen */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-slate-800 bg-slate-950 aspect-[16/7] flex items-center justify-center">
        <canvas ref={canvasRef} width={640} height={280} className="w-full h-full object-cover" />

        {/* Duration Timer Badge */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold font-mono text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>REC {formatDuration(recordDuration)}</span>
          </div>
        )}

        {!isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs space-y-1">
            <Mic className="w-8 h-8 text-slate-600 mb-1" />
            <span>Ready to Record</span>
            <span className="text-[10px] text-slate-600">Press the red button below to start microphone capture</span>
          </div>
        )}
      </div>

      {/* Recording Action Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={togglePause}
              className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>

            <button
              onClick={stopRecording}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Saved Audio Recordings List */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileAudio className="w-4 h-4 text-indigo-500" />
            <span>Saved Voice Recordings ({recordings.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">In-Memory Audio Files</span>
        </div>

        {recordings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No recordings yet. Record audio to play back and export!
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {recordings.map((rec) => {
              const isPlaying = activePlayingId === rec.id;
              const sizeKB = (rec.blob.size / 1024).toFixed(1);

              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 hover:border-slate-200 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handlePlayToggle(rec)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isPlaying
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-600"
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {rec.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {formatDuration(rec.duration)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <HardDrive className="w-3 h-3" /> {sizeKB} KB
                        </span>
                        <span>•</span>
                        <span>{rec.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownload(rec)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition"
                      title="Download WebM"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
