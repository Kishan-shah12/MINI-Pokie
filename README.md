# Mini Pokie 🎮 🛠️ ⚡
> A modern, browser-first open playground for free tools, small games, and simple AI utilities. 100% Free • No Signup • No Paywall • Fast & Modular.

---

## 🌟 Overview & Features

Mini Pokie is designed to be the ultimate single-destination browser hub where anyone can instantly access productive developer/design utilities, play lightweight casual games, and leverage server-side Gemini AI models without registration barriers, subscription paywalls, or privacy-invasive tracking.

### 🧩 Included Modular Applications

1. **QR Code Generator (`qrcode`)**:
   - Customizable content (URLs, Wi-Fi keys, vCards, plain text, emails).
   - Real-time custom foreground/background colors, error correction levels (L/M/Q/H), margin adjustments.
   - 1-click PNG & vector SVG downloads and quick copy.

2. **Markdown Studio (`markdown`)**:
   - Real-time split-screen editing with synchronized live preview.
   - Built-in starter templates (Project README, Technical Spec, Blog Post, Cheat Sheet).
   - Word count, character count, reading time estimates, and `.md` file export.

3. **Retro Snake Arcade (`snake`)**:
   - Classic 60 FPS grid-based gameplay with arrow key and touch D-Pad controls.
   - Pure Web Audio API synthesized sound effects (no external audio assets).
   - Golden Apples, speed multipliers, and persistent local high scores.

4. **Quiz Master & Trivia Arena (`quiz`)**:
   - Multiple preset question decks (Web Tech, Science & Nature, World History).
   - **Custom AI Quiz Generator**: Prompts server-side Gemini to construct customized 5-question trivia tests for ANY topic.
   - Round timer, score calculation, streak multipliers, answer explanations, and celebration confetti.

5. **AI Mini Utilities Hub (`ai-tools`)**:
   - **Text Polisher & TL;DR**: Summarize, bulletize, formalize, casualize, grammar fixes, or expand.
   - **Code & Regex Explainer**: Detailed step-by-step breakdown of JavaScript, Python, Regex, SQL, and complexity analysis.
   - **System Prompt Refiner**: Converts raw concepts into structured, high-yield system instructions.
   - **Resilient Fallback Ladder**: Automated 4-tier model failover (`gemini-3.6-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-flash-latest` ➔ `gemini-3.7-flash`).

6. **Palette Studio & Contrast Lab (`palette`)**:
   - Spacebar color harmony shuffling with individual hex lock toggles.
   - Full WCAG 2.1 Contrast Checker (AA, AAA, Large Text standards).
   - Direct CSS variable export.

7. **Secure Password & Passphrase Generator (`password`)**:
   - 100% Client-side Web Crypto API (`crypto.getRandomValues`).
   - Customizable character pools, length slider, and memorable passphrase generation.
   - Live entropy calculation and crack-time strength meter.

8. **Universal Unit & Storage Converter (`converter`)**:
   - Instant conversion across Length, Weight, Temperature, Digital Storage (Bytes/GB/TB), Speed, Time, and Area.
   - 1-click unit swap and high-precision outputs.

---

## 🔒 Security Architecture & Threat Model

Mini Pokie implements defense-in-depth across the 5 threat zones:

| Threat Zone | Identified Risks | Implemented Countermeasures |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious prompt injection, oversized payload flooding, XSS through markdown rendering. | Server-side defensive schema checks, input length limits, HTML sanitization via `rehype-sanitize`, null-safe body destructuring. |
| **Planning & Reasoning** | Prompt hijacking targeting system directives in AI endpoints. | Hardcoded strict delimiter encapsulation and defensive system prompt engineering in backend routes. |
| **Tool Execution & APIs** | SSRF or unauthorized external API invocation. | Server proxies all Gemini API requests strictly server-side; `GEMINI_API_KEY` is never exposed to the client. |
| **Memory & State** | Data persistence leaks, cross-user collisions. | Pure client-side local storage (`localStorage`) for user preferences; zero sensitive tokens stored. |
| **Inter-System Comms** | API key leaks in client bundles or network logs. | Complete server-side proxy architecture (`/api/ai/*`) using `@google/genai` TypeScript SDK with lazy initialization. |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Steps
1. Clone repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key (optional for local testing):
   # GEMINI_API_KEY="your-api-key-here"
   ```

3. Start the unified development server (Express + Vite on Port 3000):
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000`.

---

## ☁️ Google Cloud Run Deployment & Campaign Verification

### 1. Prerequisites & GCP Configuration
Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

### 2. Secret Manager Setup (Zero-Hardcoding Hygiene)
Store your `GEMINI_API_KEY` in Google Cloud Secret Manager:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run default service account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Firestore Security Rules (User Data Isolation)
If enabling persistent multi-user interaction logging, deploy the following secure rule set (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-bound document isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Block all unauthenticated root reads/writes
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Cloud Run Deployment Command
Build and deploy the containerized full-stack application directly:
```bash
gcloud run deploy mini-pokie \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 5. Mandatory Campaign Verification Labeling
Apply the verification label to qualify the service for automated challenge verification:
```bash
gcloud run services update mini-pokie \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧩 Adding New Modular Apps

Mini Pokie is architected for zero-friction extensibility. To add a new tool or game:

1. Create your component in `src/apps/MyNewApp.tsx`.
2. Register it in `src/registry.ts`:
   ```typescript
   {
     id: "my-new-app",
     title: "My New Tool",
     description: "What it does...",
     category: "tools", // "tools" | "games" | "ai"
     icon: "Wrench",    // Lucide icon name
     tags: ["New", "Utility"],
     component: MyNewApp,
   }
   ```
3. That's it! It automatically appears on the homepage, category filters, search engine, and deep-link routing.

---

## 📄 License
Open source under the [MIT License](LICENSE).
