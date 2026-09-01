import { PokieApp } from "./types";
import { QRCodeApp } from "./apps/QRCodeApp";
import { MarkdownEditorApp } from "./apps/MarkdownEditorApp";
import { SnakeGameApp } from "./apps/SnakeGameApp";
import { QuizMasterApp } from "./apps/QuizMasterApp";
import { AIUtilitiesApp } from "./apps/AIUtilitiesApp";
import { PaletteStudioApp } from "./apps/PaletteStudioApp";
import { PasswordGeneratorApp } from "./apps/PasswordGeneratorApp";
import { UnitConverterApp } from "./apps/UnitConverterApp";

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
