import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 1. Mount body parsers FIRST before any routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

/**
 * Resilient content generation with automated fallback ladder
 */
async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  responseSchemaJson?: boolean
) {
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseSchemaJson) {
        config.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`All Gemini fallback models exhausted. Last error: ${lastError?.message || "Unknown error"}`);
}

// ================= API ENDPOINTS =================

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Mini Pokie Server",
  });
});

// AI Text Polish & Summarizer
app.post("/api/ai/text-polish", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const text = typeof data.text === "string" ? data.text.trim() : "";
    const mode = typeof data.mode === "string" ? data.mode : "summarize"; // summarize, bulletize, formal, casual, fix-grammar, expand

    if (!text) {
      return res.status(400).json({ error: "Text content is required" });
    }

    if (text.length > 15000) {
      return res.status(400).json({ error: "Text exceeds maximum character limit of 15,000 characters." });
    }

    const instructionsMap: Record<string, string> = {
      summarize: "Provide a clear, high-yield summary of the text highlighting key takeaways.",
      bulletize: "Convert the input into structured, well-organized bullet points with concise sub-headers if applicable.",
      formal: "Rewrite the text in a polished, professional, and formal tone suitable for business or academic communication.",
      casual: "Rewrite the text in a friendly, conversational, and natural tone.",
      "fix-grammar": "Fix all spelling, grammar, punctuation, and phrasing issues while preserving the original meaning.",
      expand: "Expand upon the points in the text, adding helpful context and depth without fluff.",
    };

    const systemInstruction = `You are a helpful text transformation assistant on Mini Pokie. ${instructionsMap[mode] || instructionsMap.summarize} Return only the transformed text with markdown formatting where helpful.`;

    const prompt = `Input Text:\n"""\n${text}\n"""`;

    const result = await generateContentWithFallback(prompt, systemInstruction);
    return res.json({ result: result.text, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error("Error in /api/ai/text-polish:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process text transformation with AI.",
    });
  }
});

// AI Code & Regex Explainer
app.post("/api/ai/code-explain", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const code = typeof data.code === "string" ? data.code.trim() : "";
    const language = typeof data.language === "string" ? data.language : "auto";

    if (!code) {
      return res.status(400).json({ error: "Code or pattern snippet is required" });
    }

    if (code.length > 15000) {
      return res.status(400).json({ error: "Code exceeds maximum limit of 15,000 characters." });
    }

    const systemInstruction = `You are an expert software engineer and computer science educator on Mini Pokie.
Analyze the provided code, regular expression, SQL query, or script.
Provide:
1. **Overview**: High-level explanation of what this snippet does.
2. **Line-by-Line / Component Breakdown**: Step-by-step walk-through.
3. **Complexity & Performance**: Time/Space complexity (if applicable) or edge cases.
4. **Potential Gotchas / Recommendations**: Any subtle bugs or optimization tips.
Format with clean, crisp Markdown.`;

    const prompt = `Language specified: ${language}\n\nSnippet:\n\`\`\`\n${code}\n\`\`\``;

    const result = await generateContentWithFallback(prompt, systemInstruction);
    return res.json({ result: result.text, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error("Error in /api/ai/code-explain:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze code snippet with AI.",
    });
  }
});

// AI Prompt Enhancer
app.post("/api/ai/prompt-refine", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const promptInput = typeof data.prompt === "string" ? data.prompt.trim() : "";
    const targetModel = typeof data.targetModel === "string" ? data.targetModel : "General LLM";

    if (!promptInput) {
      return res.status(400).json({ error: "Initial prompt idea is required" });
    }

    const systemInstruction = `You are a world-class prompt engineer.
Take the user's initial vague or basic prompt and transform it into a structured, high-yield prompt template.
Include:
- Clear Role / Persona definition
- Context and Goal
- Explicit Output Constraints & Formatting
- Placeholders like [USER_INPUT] where relevant
- 2 example variations or follow-ups.`;

    const prompt = `Initial prompt idea: "${promptInput}"\nTarget model: ${targetModel}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);
    return res.json({ result: result.text, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error("Error in /api/ai/prompt-refine:", error);
    return res.status(500).json({
      error: error?.message || "Failed to refine prompt.",
    });
  }
});

// AI Dynamic Quiz Question Generator
app.post("/api/ai/quiz-generator", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const topic = typeof data.topic === "string" ? data.topic.trim() : "General Knowledge";
    const difficulty = typeof data.difficulty === "string" ? data.difficulty : "Medium";
    const count = typeof data.count === "number" && data.count > 0 && data.count <= 10 ? data.count : 5;

    const systemInstruction = `You are a quiz master. Create a ${count}-question multiple choice quiz on the topic "${topic}" with difficulty level "${difficulty}".
Output strictly valid JSON adhering to this structure:
{
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief 1-2 sentence explanation of why this option is correct."
    }
  ]
}`;

    const prompt = `Generate ${count} engaging multiple-choice trivia questions for topic: "${topic}".`;

    const result = await generateContentWithFallback(prompt, systemInstruction, true);
    
    // Parse JSON
    try {
      const parsed = JSON.parse(result.text);
      return res.json({ quiz: parsed, modelUsed: result.modelUsed });
    } catch (parseErr) {
      // Fallback manual extract
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ quiz: parsed, modelUsed: result.modelUsed });
      }
      throw new Error("Model returned invalid JSON format.");
    }
  } catch (error: any) {
    console.error("Error in /api/ai/quiz-generator:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate custom quiz.",
    });
  }
});

// ================= VITE & STATIC SERVING =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mini Pokie server running on http://localhost:${PORT}`);
  });
}

startServer();
