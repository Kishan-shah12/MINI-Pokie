import React, { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Users,
  Bot,
  Undo2,
  Sparkles,
  Swords,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";

type PieceColor = "w" | "b";
type ChessPieceType = "p" | "r" | "n" | "b" | "q" | "k";

interface ChessPiece {
  color: PieceColor;
  type: ChessPieceType;
}

type ChessBoard = (ChessPiece | null)[][];

// Unicode Chess Symbols
const CHESS_SYMBOLS: Record<PieceColor, Record<ChessPieceType, string>> = {
  w: {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  },
  b: {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  },
};

// Initial standard board setup
const INITIAL_CHESS_BOARD: ChessBoard = [
  [
    { color: "b", type: "r" },
    { color: "b", type: "n" },
    { color: "b", type: "b" },
    { color: "b", type: "q" },
    { color: "b", type: "k" },
    { color: "b", type: "b" },
    { color: "b", type: "n" },
    { color: "b", type: "r" },
  ],
  Array(8)
    .fill(null)
    .map(() => ({ color: "b" as PieceColor, type: "p" as ChessPieceType })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8)
    .fill(null)
    .map(() => ({ color: "w" as PieceColor, type: "p" as ChessPieceType })),
  [
    { color: "w", type: "r" },
    { color: "w", type: "n" },
    { color: "w", type: "b" },
    { color: "w", type: "q" },
    { color: "w", type: "k" },
    { color: "w", type: "b" },
    { color: "w", type: "n" },
    { color: "w", type: "r" },
  ],
];

// Audio Sound Synthesis
function playChessSound(type: "move" | "capture" | "check" | "win") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "move") {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "capture") {
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "check") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) {
    // Ignore audio restrictions
  }
}

export const ChessApp: React.FC = () => {
  const [board, setBoard] = useState<ChessBoard>(() =>
    INITIAL_CHESS_BOARD.map((r) => r.map((c) => (c ? { ...c } : null)))
  );

  const [turn, setTurn] = useState<PieceColor>("w");
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [gameMode, setGameMode] = useState<"ai" | "pvp">("ai");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium">("medium");
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<PieceColor | "draw" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [historyBoards, setHistoryBoards] = useState<{
    board: ChessBoard;
    turn: PieceColor;
    cw: ChessPiece[];
    cb: ChessPiece[];
  }[]>([]);

  // Piece Values for AI evaluation
  const PIECE_VALUES: Record<ChessPieceType, number> = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900,
  };

  // Generate pseudolegal moves for a square
  const getMovesForPiece = useCallback(
    (b: ChessBoard, r: number, c: number): { r: number; c: number }[] => {
      const piece = b[r][c];
      if (!piece) return [];
      const moves: { r: number; c: number }[] = [];
      const color = piece.color;
      const enemy = color === "w" ? "b" : "w";

      const inBounds = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

      // 1. Pawn
      if (piece.type === "p") {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;

        // Forward 1
        if (inBounds(r + dir, c) && !b[r + dir][c]) {
          moves.push({ r: r + dir, c });
          // Forward 2 from start
          if (r === startRow && inBounds(r + dir * 2, c) && !b[r + dir * 2][c]) {
            moves.push({ r: r + dir * 2, c });
          }
        }
        // Diagonal Captures
        for (const dc of [-1, 1]) {
          const nr = r + dir;
          const nc = c + dc;
          if (inBounds(nr, nc) && b[nr][nc] && b[nr][nc]?.color === enemy) {
            moves.push({ r: nr, c: nc });
          }
        }
      }

      // 2. Knight
      else if (piece.type === "n") {
        const deltas = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc)) {
            if (!b[nr][nc] || b[nr][nc]?.color === enemy) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
      }

      // 3. Bishop & Queen diagonals
      if (piece.type === "b" || piece.type === "q") {
        const dirs = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ];
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (!inBounds(nr, nc)) break;
            if (!b[nr][nc]) {
              moves.push({ r: nr, c: nc });
            } else {
              if (b[nr][nc]?.color === enemy) moves.push({ r: nr, c: nc });
              break;
            }
            step++;
          }
        }
      }

      // 4. Rook & Queen straight lines
      if (piece.type === "r" || piece.type === "q") {
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (!inBounds(nr, nc)) break;
            if (!b[nr][nc]) {
              moves.push({ r: nr, c: nc });
            } else {
              if (b[nr][nc]?.color === enemy) moves.push({ r: nr, c: nc });
              break;
            }
            step++;
          }
        }
      }

      // 5. King
      if (piece.type === "k") {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc)) {
              if (!b[nr][nc] || b[nr][nc]?.color === enemy) {
                moves.push({ r: nr, c: nc });
              }
            }
          }
        }
      }

      return moves;
    },
    []
  );

  // Execute Move
  const makeMove = useCallback(
    (
      from: { r: number; c: number },
      to: { r: number; c: number },
      currentBoard: ChessBoard,
      currentTurn: PieceColor
    ) => {
      const newBoard = currentBoard.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      const movingPiece = newBoard[from.r][from.c];
      if (!movingPiece) return;

      const targetPiece = newBoard[to.r][to.c];

      // Save history for undo
      setHistoryBoards((prev) => [
        ...prev,
        {
          board: currentBoard.map((r) => r.map((c) => (c ? { ...c } : null))),
          turn: currentTurn,
          cw: [...capturedByWhite],
          cb: [...capturedByBlack],
        },
      ]);

      // Capture track
      if (targetPiece) {
        if (movingPiece.color === "w") {
          setCapturedByWhite((prev) => [...prev, targetPiece]);
        } else {
          setCapturedByBlack((prev) => [...prev, targetPiece]);
        }
        if (soundEnabled) playChessSound("capture");
      } else if (soundEnabled) {
        playChessSound("move");
      }

      // Move piece
      newBoard[to.r][to.c] = movingPiece;
      newBoard[from.r][from.c] = null;

      // Pawn promotion to Queen
      if (movingPiece.type === "p") {
        if ((movingPiece.color === "w" && to.r === 0) || (movingPiece.color === "b" && to.r === 7)) {
          movingPiece.type = "q";
        }
      }

      // King capture ends game
      if (targetPiece && targetPiece.type === "k") {
        setWinner(movingPiece.color);
        if (soundEnabled) playChessSound("win");
        confetti({ particleCount: 70, spread: 60 });
      }

      // Record move notation
      const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const moveStr = `${movingPiece.type.toUpperCase()}${cols[from.c]}${8 - from.r} → ${cols[to.c]}${8 - to.r}`;
      setMoveHistory((h) => [...h.slice(-15), moveStr]);

      setBoard(newBoard);
      setSelectedSquare(null);
      setValidMoves([]);
      setTurn(currentTurn === "w" ? "b" : "w");
    },
    [capturedByWhite, capturedByBlack, soundEnabled]
  );

  // User click square handler
  const handleSquareClick = (r: number, c: number) => {
    if (winner || isThinking) return;
    if (gameMode === "ai" && turn === "b") return; // AI's turn

    const piece = board[r][c];

    // If square is an active valid move target
    if (selectedSquare) {
      const isTarget = validMoves.some((m) => m.r === r && m.c === c);
      if (isTarget) {
        makeMove(selectedSquare, { r, c }, board, turn);
        return;
      }
    }

    // If clicking own piece, select it
    if (piece && piece.color === turn) {
      setSelectedSquare({ r, c });
      const moves = getMovesForPiece(board, r, c);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameMode !== "ai" || turn !== "b" || winner) return;

    setIsThinking(true);
    const timer = setTimeout(() => {
      // Find all possible Black moves
      const allMoves: { from: { r: number; c: number }; to: { r: number; c: number }; score: number }[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.color === "b") {
            const moves = getMovesForPiece(board, r, c);
            for (const to of moves) {
              const target = board[to.r][to.c];
              let score = 0;
              if (target) {
                score += PIECE_VALUES[target.type] * 2; // Capture bonus
              }
              // Center control bonus
              if (to.r >= 3 && to.r <= 4 && to.c >= 3 && to.c <= 4) {
                score += 3;
              }
              // Add slight randomness for variety
              score += Math.random() * (aiDifficulty === "easy" ? 10 : 3);
              allMoves.push({ from: { r, c }, to, score });
            }
          }
        }
      }

      if (allMoves.length > 0) {
        // Sort descending
        allMoves.sort((a, b) => b.score - a.score);
        const chosen = allMoves[0];
        makeMove(chosen.from, chosen.to, board, "b");
      } else {
        // Stalemate or checkmate
        setWinner("w");
      }
      setIsThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [turn, gameMode, winner, board, aiDifficulty, getMovesForPiece, makeMove, PIECE_VALUES]);

  // Reset Board
  const resetGame = () => {
    setBoard(INITIAL_CHESS_BOARD.map((r) => r.map((c) => (c ? { ...c } : null))));
    setTurn("w");
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setMoveHistory([]);
    setHistoryBoards([]);
    setIsThinking(false);
  };

  // Undo Last Move
  const handleUndo = () => {
    if (historyBoards.length === 0 || isThinking) return;
    const prev = historyBoards[historyBoards.length - 1];
    setBoard(prev.board);
    setTurn(prev.turn);
    setCapturedByWhite(prev.cw);
    setCapturedByBlack(prev.cb);
    setSelectedSquare(null);
    setValidMoves([]);
    setWinner(null);
    setHistoryBoards((h) => h.slice(0, -1));
    setMoveHistory((m) => m.slice(0, -1));
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-600 to-amber-700 flex items-center justify-center font-black text-white text-lg shadow-sm">
            ♚
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Chess Arena</h2>
            <p className="text-xs text-slate-400">Tactics & Strategy</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                setGameMode("ai");
                resetGame();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                gameMode === "ai" ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs AI
            </button>
            <button
              onClick={() => {
                setGameMode("pvp");
                resetGame();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                gameMode === "pvp" ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2-Player
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 w-full items-start">
        {/* Chess Board Area */}
        <div className="flex flex-col items-center">
          {/* Black Captured Pieces Tray */}
          <div className="w-full max-w-[440px] flex items-center justify-between px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                {gameMode === "ai" ? <Bot className="w-3.5 h-3.5 text-indigo-400" /> : "Black"}
                {isThinking && <span className="text-[10px] text-amber-400 animate-pulse">thinking...</span>}
              </span>
              <div className="flex flex-wrap gap-0.5 text-base text-slate-300">
                {capturedByWhite.map((p, idx) => (
                  <span key={idx}>{CHESS_SYMBOLS[p.color][p.type]}</span>
                ))}
              </div>
            </div>
            {turn === "b" && !winner && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-md">
                Active Turn
              </span>
            )}
          </div>

          {/* 8x8 Board Container */}
          <div className="relative p-2 bg-amber-950 rounded-2xl border-4 border-amber-900 shadow-2xl">
            <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[420px] aspect-square rounded-xl overflow-hidden border border-amber-900">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                  const isValidTarget = validMoves.some((m) => m.r === r && m.c === c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer font-serif ${
                        isLight ? "bg-[#e2d6b5]" : "bg-[#b88b4a]"
                      } ${isSelected ? "ring-4 ring-amber-400 ring-inset z-10" : ""} hover:brightness-105`}
                    >
                      {/* Valid Move Indicator */}
                      {isValidTarget && (
                        <div
                          className={`absolute w-4 h-4 rounded-full ${
                            piece ? "ring-4 ring-red-500/80 bg-red-400/40" : "bg-emerald-600/70"
                          } z-10 animate-pulse`}
                        />
                      )}

                      {/* Chess Piece Symbol */}
                      {piece && (
                        <span
                          className={`drop-shadow-sm transition-transform active:scale-90 ${
                            piece.color === "w"
                              ? "text-slate-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                              : "text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]"
                          }`}
                        >
                          {CHESS_SYMBOLS[piece.color][piece.type]}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Winner Overlay */}
            {winner && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-in fade-in">
                <Crown className="w-12 h-12 text-amber-400 mb-2" />
                <h3 className="text-2xl font-black text-white">
                  {winner === "draw" ? "Stalemate!" : `${winner === "w" ? "White" : "Black"} Wins!`}
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Checkmate by decisive strategy</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* White Captured Pieces Tray */}
          <div className="w-full max-w-[440px] flex items-center justify-between px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">White (You)</span>
              <div className="flex flex-wrap gap-0.5 text-base text-slate-300">
                {capturedByBlack.map((p, idx) => (
                  <span key={idx}>{CHESS_SYMBOLS[p.color][p.type]}</span>
                ))}
              </div>
            </div>
            {turn === "w" && !winner && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md">
                Active Turn
              </span>
            )}
          </div>
        </div>

        {/* Right Info & Move History Panel */}
        <div className="flex flex-col gap-3 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Game State</span>
              <button
                onClick={handleUndo}
                disabled={historyBoards.length === 0 || isThinking}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
            </div>

            {gameMode === "ai" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Difficulty</span>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                >
                  <option value="easy">Casual AI</option>
                  <option value="medium">Challenger AI</option>
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Move</span>
              <span className="font-bold text-amber-400 capitalize">
                {turn === "w" ? "White's Turn" : "Black's Turn"}
              </span>
            </div>
          </div>

          {/* Move History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 min-h-[180px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Move History
            </span>
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1 font-mono text-xs text-slate-300">
              {moveHistory.length === 0 ? (
                <span className="text-slate-600 text-xs italic">No moves recorded yet</span>
              ) : (
                moveHistory.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-500">#{idx + 1}</span>
                    <span className="font-semibold text-slate-200">{m}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
