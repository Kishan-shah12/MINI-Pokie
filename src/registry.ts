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

export const APPS_REGISTRY: PokieApp[] = [
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
