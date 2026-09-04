import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

export const app = express();

// 1. Mount body parsers FIRST before any routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lazy/Safe Gemini Client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

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
export async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  responseSchemaJson?: boolean
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment variables. Please add GEMINI_API_KEY to your Vercel or environment settings."
    );
  }

  const ai = getGeminiClient();
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
      console.warn(
        `[Gemini Fallback] Model ${model} failed, trying next fallback:`,
        err?.message || err
      );
      lastError = err;
    }
  }

  throw new Error(
    `All Gemini fallback models exhausted. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
}

// ================= API ENDPOINTS =================

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Mini Pokie Server",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
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
      return res.status(400).json({
        error: "Text exceeds maximum character limit of 15,000 characters.",
      });
    }

    const instructionsMap: Record<string, string> = {
      summarize:
        "Provide a clear, high-yield summary of the text highlighting key takeaways.",
      bulletize:
        "Convert the input into structured, well-organized bullet points with concise sub-headers if applicable.",
      formal:
        "Rewrite the text in a polished, professional, and formal tone suitable for business or academic communication.",
      casual:
        "Rewrite the text in a friendly, conversational, and natural tone.",
      "fix-grammar":
        "Fix all spelling, grammar, punctuation, and phrasing issues while preserving the original meaning.",
      expand:
        "Expand upon the points in the text, adding helpful context and depth without fluff.",
    };

    const systemInstruction = `You are a helpful text transformation assistant on Mini Pokie. ${
      instructionsMap[mode] || instructionsMap.summarize
    } Return only the transformed text with markdown formatting where helpful.`;

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
      return res.status(400).json({
        error: "Code exceeds maximum limit of 15,000 characters.",
      });
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
    const targetModel =
      typeof data.targetModel === "string" ? data.targetModel : "General LLM";

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
    const topic =
      typeof data.topic === "string" ? data.topic.trim() : "General Knowledge";
    const difficulty =
      typeof data.difficulty === "string" ? data.difficulty : "Medium";
    const count =
      typeof data.count === "number" && data.count > 0 && data.count <= 10
        ? data.count
        : 5;

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

    const result = await generateContentWithFallback(
      prompt,
      systemInstruction,
      true
    );

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

// AI Interactive Assistant Chat & Playground
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const message = typeof data.message === "string" ? data.message.trim() : "";
    const history = Array.isArray(data.history) ? data.history : [];
    const persona = typeof data.persona === "string" ? data.persona : "general";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const personaPrompts: Record<string, string> = {
      general: "You are an intelligent, helpful, friendly and precise AI Assistant on Mini Pokie. Provide structured, clean, and engaging markdown responses.",
      coder: "You are an expert senior software engineer and architect. Provide clean, well-commented code snippets, architecture breakdowns, bug analysis, and performance recommendations.",
      copywriter: "You are a master creative copywriter and editor. Craft compelling, persuasive, and crisp copy tailored to the user's objective.",
      tutor: "You are an encouraging, world-class educator. Explain complex topics using intuitive analogies, step-by-step reasoning, and verification questions.",
      brainstormer: "You are a high-energy creative ideator. Generate innovative, diverse, out-of-the-box ideas, categorized with pros and cons.",
    };

    const systemInstruction = personaPrompts[persona] || personaPrompts.general;

    // Build context prompt
    let conversationText = "";
    if (history.length > 0) {
      conversationText += "Conversation History:\n";
      for (const h of history.slice(-6)) {
        if (h && typeof h.content === "string") {
          conversationText += `${h.role === "user" ? "User" : "Assistant"}: ${h.content}\n`;
        }
      }
      conversationText += "\n";
    }
    conversationText += `User: ${message}\nAssistant:`;

    const result = await generateContentWithFallback(conversationText, systemInstruction);
    return res.json({ reply: result.text, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error("Error in /api/ai/chat:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process chat with AI.",
    });
  }
});

// AI App Idea & Feature Spec Enhancer
app.post("/api/ai/suggest-spec", async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === "object" ? req.body : {};
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const category = typeof data.category === "string" ? data.category : "tools";
    const description = typeof data.description === "string" ? data.description.trim() : "";

    if (!title) {
      return res.status(400).json({ error: "App title is required" });
    }

    const systemInstruction = `You are an expert product designer and frontend web engineer for Mini Pokie (a zero-signup browser mini-app suite).
Given a user's proposed tool/game idea, generate a concise, high-yield recommendation list of 3-4 key features, UX controls, and client-side implementation ideas.
Format as brief bullet points. Keep it under 100 words.`;

    const prompt = `Proposed App: "${title}"\nCategory: ${category}\nUser Description: "${description}"`;

    const result = await generateContentWithFallback(prompt, systemInstruction);
    return res.json({ spec: result.text, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error("Error in /api/ai/suggest-spec:", error);
    return res.status(500).json({
      error: error?.message || "Failed to brainstorm app suggestions.",
    });
  }
});

export default app;

