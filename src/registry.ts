import { PokieApp } from "./types";
import { QRCodeApp } from "./apps/QRCodeApp";
import { MarkdownEditorApp } from "./apps/MarkdownEditorApp";
import { SnakeGameApp } from "./apps/SnakeGameApp";
import { Game2048App } from "./apps/Game2048App";
import { QuizMasterApp } from "./apps/QuizMasterApp";
import { AIUtilitiesApp } from "./apps/AIUtilitiesApp";
import { PaletteStudioApp } from "./apps/PaletteStudioApp";
import { PasswordGeneratorApp } from "./apps/PasswordGeneratorApp";
import { UnitConverterApp } from "./apps/UnitConverterApp";
import { MinesweeperApp } from "./apps/MinesweeperApp";
import { WordGuessApp } from "./apps/WordGuessApp";
import { MemoryMatchApp } from "./apps/MemoryMatchApp";
import { TypingSprintApp } from "./apps/TypingSprintApp";
import { BrickBreakerApp } from "./apps/BrickBreakerApp";
import { TicTacToeApp } from "./apps/TicTacToeApp";
import { CandyCrushApp } from "./apps/CandyCrushApp";
import { SubwaySurfersApp } from "./apps/SubwaySurfersApp";
import { HillClimbApp } from "./apps/HillClimbApp";
import { JsonFormatterApp } from "./apps/JsonFormatterApp";
import { SudokuApp } from "./apps/SudokuApp";
import { RegexTesterApp } from "./apps/RegexTesterApp";
import { FlappyBirdApp } from "./apps/FlappyBirdApp";
import { HashEncoderApp } from "./apps/HashEncoderApp";
import { AudioRecorderApp } from "./apps/AudioRecorderApp";

export const APPS_REGISTRY: PokieApp[] = [
  {
    id: "json-formatter",
    title: "JSON Formatter & Validator",
    description: "Format, minify, repair, and inspect JSON payloads with real-time error pointer detection, schema depth stats, and collapsible interactive tree visualization.",
    category: "tools",
    icon: "FileJson",
    tags: ["JSON", "Developer", "Formatter", "Validator", "Syntax"],
    badge: "Dev Tools",
    component: JsonFormatterApp,
  },
  {
    id: "sudoku",
    title: "Sudoku Logic Master",
    description: "Classic 9x9 Sudoku puzzle with Easy to Expert difficulties, pencil notes mode, conflict highlighter, smart hints, undo history, and sound effects.",
    category: "games",
    icon: "BrainCircuit",
    tags: ["Sudoku", "Puzzle", "Logic", "Brain Game", "Numbers"],
    badge: "Logic",
    component: SudokuApp,
  },
  {
    id: "regex-tester",
    title: "Regex Playground & Tester",
    description: "Live regular expression evaluator with interactive match overlays, capture group inspector, flags toggle, replacement previews, and preset library.",
    category: "tools",
    icon: "Terminal",
    tags: ["Regex", "Developer", "Testing", "Expressions", "Substitution"],
    badge: "Dev Tools",
    component: RegexTesterApp,
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird Arcade 60FPS",
    description: "Smooth 60 FPS physics arcade flapper with retro pipe navigation, golden coin pickups, Bronze/Silver/Gold medals, and high score records.",
    category: "games",
    icon: "Award",
    tags: ["Retro", "Arcade", "Flappy", "Physics", "Endless"],
    badge: "Arcade",
    component: FlappyBirdApp,
  },
  {
    id: "hash-encoder",
    title: "Base64 & Crypto Hash Suite",
    description: "Comprehensive encryption & encoding suite: Base64 encode/decode, SHA-256 / SHA-512 / MD5 hashes, URL percent codec, Hex/Binary, and ROT13 cipher.",
    category: "tools",
    icon: "KeyRound",
    tags: ["Security", "Encoding", "Base64", "Hash", "Crypto", "SHA256"],
    badge: "Crypto",
    component: HashEncoderApp,
  },
  {
    id: "audio-recorder",
    title: "Audio Voice Recorder & Visualizer",
    description: "In-browser microphone voice recorder with real-time frequency equalizer & oscilloscope waveform visualizers, playback management, and WebM download.",
    category: "tools",
    icon: "Radio",
    tags: ["Audio", "Microphone", "Waveform", "Recording", "Voice"],
    badge: "Audio",
    component: AudioRecorderApp,
  },
  {
    id: "subway-surfers",
    title: "Subway 3D Runner",
    description: "60 FPS 3-lane 3D perspective subway runner. Dodge oncoming trains, jump over hurdles, slide under barriers, and collect powerups!",
    category: "games",
    icon: "Flame",
    tags: ["3D Runner", "Endless", "Arcade", "High Speed", "Subway"],
    badge: "Hot",
    component: SubwaySurfersApp,
  },
  {
    id: "hill-climb",
    title: "Hill Climb Offroad",
    description: "2D physics mountain vehicle racing. Throttle through rolling hills, manage fuel canisters, perform stunt backflips, and upgrade your Jeep!",
    category: "games",
    icon: "Gauge",
    tags: ["Physics", "Driving", "Offroad", "Upgrades", "Racing"],
    badge: "Physics",
    component: HillClimbApp,
  },
  {
    id: "candy-crush",
    title: "Candy Match Crush",
    description: "Juicy match-3 arcade puzzle with cascading gravity drops, combo multipliers, striped & explosive special candies, and stage targets.",
    category: "games",
    icon: "Sparkles",
    tags: ["Match 3", "Puzzle", "Candies", "Cascades", "Combos"],
    badge: "Popular",
    component: CandyCrushApp,
  },
  {
    id: "tictactoe",
    title: "Tic Tac Toe Pro",
    description: "Classic 3x3 and 5x5 grid strategy with Unbeatable Minimax AI, 2-Player Pass & Play, Cyberpunk/Neon themes, and audio FX.",
    category: "games",
    icon: "Grid3X3",
    tags: ["Classic", "AI Minimax", "2-Player", "Strategy", "Themes"],
    badge: "Classic",
    component: TicTacToeApp,
  },
  {
    id: "qrcode",
    title: "QR Code Generator",
    description: "Generate customized high-resolution QR codes with instant PNG & SVG downloads, custom colors, and error correction.",
    category: "tools",
    icon: "QrCode",
    tags: ["Utility", "SVG", "Export", "Offline"],
    badge: "Popular",
    component: QRCodeApp,
  },
  {
    id: "2048",
    title: "2048 Puzzle Arcade",
    description: "The addictive tile merging puzzle. Slide numbers, combine matches, trigger chiptune sounds, and reach the 2048 tile!",
    category: "games",
    icon: "Grid",
    tags: ["Puzzle", "Numbers", "Classic", "Brain Game"],
    badge: "Hot",
    component: Game2048App,
  },
  {
    id: "brick-breaker",
    title: "Brick Breaker Retro Arcade",
    description: "60 FPS classic breakout with multi-hit bricks, explosive bombs, laser cannons, fireball power-ups, and 3 level stages.",
    category: "games",
    icon: "Flame",
    tags: ["Arcade", "Action", "Power-ups", "Retro 60fps"],
    badge: "Arcade",
    component: BrickBreakerApp,
  },
  {
    id: "wordle",
    title: "Wordle Guess Arcade",
    description: "Guess the hidden 5-letter word in 6 tries. Featuring on-screen keyboard, flip color hints, dictionary validation, and streak tracking.",
    category: "games",
    icon: "Sparkles",
    tags: ["Word Game", "Brain", "Daily", "Puzzles"],
    badge: "Popular",
    component: WordGuessApp,
  },
  {
    id: "snake",
    title: "Retro Snake Arcade",
    description: "Classic arcade snake with smooth 60fps grid movement, Web Audio sound effects, food powerups, and persistent high scores.",
    category: "games",
    icon: "Gamepad2",
    tags: ["Arcade", "Audio FX", "Keyboard & Touch", "Classic"],
    badge: "Hot",
    component: SnakeGameApp,
  },
  {
    id: "minesweeper",
    title: "Minesweeper Pro",
    description: "Classic logic puzzle with Beginner, Intermediate, and Expert grids. Safe first click, quick chording, sound chimes, and timer records.",
    category: "games",
    icon: "Bomb",
    tags: ["Logic", "Classic", "Strategy", "Retro"],
    badge: "Classic",
    component: MinesweeperApp,
  },
  {
    id: "typing-sprint",
    title: "Speed Typing Hero",
    description: "Fast-paced typing test with 30s/60s sprints, real-world code snippets, mechanical keyboard click sounds, live WPM, and accuracy rating.",
    category: "games",
    icon: "Keyboard",
    tags: ["Typing", "Speed Test", "Code Snippets", "Skills"],
    badge: "Challenge",
    component: TypingSprintApp,
  },
  {
    id: "memory-match",
    title: "Memory Card Match & Speed Flip",
    description: "Test and train your visual memory. Flip 3D cards across Arcade, Space, Wildlife, and Tech themes with combo multipliers.",
    category: "games",
    icon: "Layers",
    tags: ["Memory", "Cards", "Visual", "Brain Training"],
    badge: "Fun",
    component: MemoryMatchApp,
  },
  {
    id: "quiz",
    title: "Quiz Master & Trivia Arena",
    description: "Challenge your mind with standard trivia decks or generate infinite custom quizzes on any topic using Gemini AI!",
    category: "games",
    icon: "HelpCircle",
    tags: ["Trivia", "AI Generated", "Timer", "Education"],
    badge: "AI Powered",
    component: QuizMasterApp,
  },
  {
    id: "markdown",
    title: "Markdown Studio",
    description: "Real-time split-screen markdown editor with live HTML preview, syntax highlighting, templates, and word count stats.",
    category: "tools",
    icon: "FileEdit",
    tags: ["Writing", "Markdown", "Export", "Preview"],
    badge: "Essential",
    component: MarkdownEditorApp,
  },
  {
    id: "ai-tools",
    title: "AI Mini Utilities Hub",
    description: "Zero-friction AI assistance: text polisher, code & regex explainer, and system prompt refiner with resilient multi-model fallback.",
    category: "ai",
    icon: "Sparkles",
    tags: ["Gemini", "Summarizer", "Code Analysis", "Prompt Engineering"],
    badge: "AI Powered",
    component: AIUtilitiesApp,
  },
  {
    id: "palette",
    title: "Palette Studio & Contrast Lab",
    description: "Harmonious color palette generator with WCAG 2.1 accessibility checker, hex lock toggles, and direct CSS/Tailwind export.",
    category: "tools",
    icon: "Palette",
    tags: ["Design", "WCAG", "CSS", "Color Theory"],
    component: PaletteStudioApp,
  },
  {
    id: "password",
    title: "Secure Password Generator",
    description: "Cryptographically secure random password and memorable passphrase generator with entropy & strength analysis.",
    category: "tools",
    icon: "KeyRound",
    tags: ["Security", "CSPRNG", "Passphrase", "Entropy"],
    badge: "Secure",
    component: PasswordGeneratorApp,
  },
  {
    id: "converter",
    title: "Unit & Storage Converter",
    description: "Instant bidirectional unit conversions for length, mass, digital storage, temperature, speed, area, and time.",
    category: "tools",
    icon: "ArrowRightLeft",
    tags: ["Math", "Data", "Storage", "Physics"],
    component: UnitConverterApp,
  },
];

export const getAppById = (id: string): PokieApp | undefined => {
  return APPS_REGISTRY.find((app) => app.id === id);
};
