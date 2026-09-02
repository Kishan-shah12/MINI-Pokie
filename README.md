# Mini Pokie 🎮 🛠️ ⚡
> **The Modern, High-Performance Browser Playground & Web Utilities Suite**  
> *Instant Access • Zero Authentication Friction • Private & Client-First • Production-Grade Server-Side Gemini AI*

---

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.7_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Ready-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)

</div>

---

## 🌟 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Application & Mini-Tool Catalog](#-application--mini-tool-catalog)
- [AI Capabilities & Fallback Protocol](#-ai-capabilities--fallback-protocol)
- [Threat Modeling & Security Posture](#-threat-modeling--security-posture)
- [API Reference](#-api-reference)
- [Deployment: Vercel (Serverless)](#-deploying-to-vercel)
- [Deployment: Google Cloud Run (Containerized)](#-deploying-to-google-cloud-run)
- [Local Development Guide](#-local-development-guide)
- [Extensibility: Adding New Modules](#-extensibility-adding-new-modules)

---

## 📖 Overview

**Mini Pokie** is an open, client-first web suite that brings together daily utilities, retro arcade games, and server-proxied AI intelligence under a unified, ultra-responsive single-page interface. 

### Core Highlights:
- ⚡ **Instant Execution**: All core games and productivity tools run client-side with sub-millisecond response latency.
- 🛡️ **Zero Tracking & Privacy Respect**: No third-party ad telemetry, cookies, or user tracking.
- 🎨 **Adaptive Theme Engine**: Class-based dark and light modes with automated system preference detection.
- 🤖 **Resilient Server-Side AI**: Gemini models run behind a secure Express/Vercel serverless layer with 4-stage automated failover.
- 📱 **Fully Responsive**: Native desktop layout transitions seamlessly to touch-optimized mobile viewports.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MINI POKIE CLIENT                               │
│  React 18 + Vite SPA • Tailwind CSS v4 • Lucide Icons • Web Audio Synthesizer│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  Local Client Tools   │             │   AI Network Gateway  │
        │  • Snake (Canvas 60fps)│            │   (HTTP JSON Requests)│
        │  • 2048 Matrix Engine │             └───────────┬───────────┘
        │  • QR Code Vectorizer │                         │
        │  • Markdown Live View │                         ▼
        │  • Palette Lab / WCAG │             ┌───────────────────────┐
        │  • Web Crypto Passgen │             │  /api/* Proxy Server  │
        │  • Unit Convert Engine│             │  • Express / Vite Dev │
        └───────────────────────┘             │  • Vercel Serverless  │
                                              │  • Cloud Run Engine   │
                                              └───────────┬───────────┘
                                                          │
                                                          ▼
                                              ┌───────────────────────┐
                                              │  Google Gemini Engine │
                                              │  • gemini-3.6-flash   │
                                              │  • gemini-3.1-lite    │
                                              │  • gemini-flash-latest│
                                              │  • gemini-3.7-flash   │
                                              └───────────────────────┘
```

---

## 🧩 Application & Mini-Tool Catalog

| App Identifier | Title | Category | Technical Specifications & Key Features |
| :--- | :--- | :--- | :--- |
| `2048` | **2048 Puzzle Arcade** | `games` | 4x4 slide matrix, move history undo stack, Web Audio chime synthesis, high score persistence. |
| `snake` | **Retro Snake Arcade** | `games` | 60 FPS HTML5 canvas, Golden Apple bonuses, speed scaling, touch D-Pad controls. |
| `quiz` | **Quiz Master & Trivia Arena** | `games` | Multi-category trivia decks, AI dynamic quiz generator, streak multipliers, sound FX. |
| `qrcode` | **QR Code Studio** | `tools` | Real-time vector generator, error correction toggles, foreground/background color picker, PNG/SVG exports. |
| `markdown` | **Markdown Studio** | `tools` | Split-pane live editor, starter templates, word/char counters, HTML preview sanitized via `rehype-sanitize`. |
| `palette` | **Palette Studio & Contrast Lab** | `tools` | Spacebar color harmony generator, hex locks, WCAG 2.1 AA/AAA compliance checker, CSS export. |
| `password` | **Password & Passphrase Lab** | `tools` | Web Crypto API (`crypto.getRandomValues`), entropy measurement, dictionary passphrase generator. |
| `converter` | **Universal Unit Converter** | `tools` | High-precision converter for Length, Weight, Temperature, Digital Bytes, Speed, Time, and Area. |
| `ai-tools` | **AI Utilities Hub** | `ai` | Text Polisher (summarize, grammar, formalize), Code/Regex Explainer, System Prompt Refiner. |

---

## 🤖 AI Capabilities & Fallback Protocol

All AI transformations are executed server-side via the `@google/genai` SDK to maintain secret hygiene and ensure high availability.

### Automated Model Fallback Ladder

To prevent downtime from region quotas or temporary service disruptions, requests pass through a sequential fallback pipeline:

```text
Primary: gemini-3.6-flash
   │
   ▼ (on 429, 503, or 500 status)
Fallback 1: gemini-3.1-flash-lite
   │
   ▼
Fallback 2: gemini-flash-latest
   │
   ▼
Deep Reasoning Fallback: gemini-3.7-flash
```

---

## 🔒 Threat Modeling & Security Posture

| Threat Zone | Identified Vectors | Implemented Security Safeguards |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection, malicious Markdown XSS, large payload DOS. | Express JSON body parsers with 10MB bounds, `rehype-sanitize` for rendered HTML, defensive schema guards. |
| **Planning & Reasoning** | Prompt escape attacking system instructions. | Explicit delimiter encapsulation (`"""`) and fixed system prompts in backend routes. |
| **Tool Execution** | Arbitrary code execution or SSRF. | No dynamic code evaluation (`eval`); strict API proxies with whitelisted parameter types. |
| **Memory & State** | Cross-tenant data leakage or corrupted local state. | Pure client-side `localStorage` isolation; zero server-side credential persistence. |
| **Inter-System Comms** | Browser API key leakage. | Zero client-side API keys. `GEMINI_API_KEY` is strictly accessed within serverless/container backend environments. |

---

## 🔌 API Reference

### 1. Text Transformation & Polish
- **Endpoint**: `POST /api/ai/text-polish`
- **Request Payload**:
  ```json
  {
    "text": "The quick brown fox jumps over the lazy dog.",
    "mode": "summarize" 
  }
  ```
  *(Supported modes: `summarize`, `bulletize`, `formal`, `casual`, `fix-grammar`, `expand`)*
- **Response**:
  ```json
  {
    "result": "Transformed text output here...",
    "modelUsed": "gemini-3.6-flash"
  }
  ```

### 2. Code & Regex Explainer
- **Endpoint**: `POST /api/ai/code-explain`
- **Request Payload**:
  ```json
  {
    "code": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$",
    "language": "regex"
  }
  ```
- **Response**:
  ```json
  {
    "result": "### Overview\nMatches passwords with minimum 8 characters...",
    "modelUsed": "gemini-3.6-flash"
  }
  ```

### 3. Prompt Refiner
- **Endpoint**: `POST /api/ai/prompt-refine`
- **Request Payload**:
  ```json
  {
    "prompt": "write a python script to parse csv",
    "targetModel": "Gemini 3.7 Flash"
  }
  ```

### 4. Dynamic AI Quiz Generator
- **Endpoint**: `POST /api/ai/quiz-generator`
- **Request Payload**:
  ```json
  {
    "topic": "Quantum Computing",
    "difficulty": "Medium",
    "count": 5
  }
  ```

## 💻 Local Development Guide

```bash
# 1. Clone & Install
git clone https://github.com/your-username/mini-pokie.git
cd mini-pokie
npm install

# 2. Configure Environment
cp .env.example .env
# Open .env and set your GEMINI_API_KEY="AIza..."

# 3. Start Unified Server
npm run dev

# 4. Open in Browser
# http://localhost:3000
```

---

## 🛠️ Extensibility: Adding New Modules

Mini Pokie is architected for frictionless modularity. To add a new mini app:

1. **Create the App Component**: Add `src/apps/MyNewApp.tsx`.
2. **Register the App**: In `src/registry.ts`, add:
   ```typescript
   {
     id: "my-app",
     title: "My New Application",
     description: "What makes this tool great...",
     category: "tools", // "tools" | "games" | "ai"
     icon: "Sparkles",   // Any Lucide icon
     tags: ["Productivity", "Fast"],
     badge: "New",
     component: MyNewApp,
   }
   ```
3. The catalog, search engine, sidebar, and URL deep linking automatically incorporate your new module!
