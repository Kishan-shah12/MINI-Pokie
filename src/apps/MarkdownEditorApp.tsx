import React, { useState, useMemo } from "react";
import {
  FileText,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Link,
  Download,
  Copy,
  Check,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  BookOpen,
} from "lucide-react";

const TEMPLATES: Record<string, string> = {
  readme: `# Mini Pokie 🚀
A fast, browser-first toolbox of free utilities and mini-games.

## Features
- ⚡ **Zero Setup**: Runs directly in the browser
- 🔒 **Privacy-First**: No tracking, no paywalls, no forced logins
- 🧩 **Modular**: Easy to add new mini-apps and utilities

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture
| Module | Category | Description |
| :--- | :--- | :--- |
| QR Studio | Tool | High-res customizable QR code generator |
| Markdown Live | Tool | Real-time split editor & exporter |
| Snake Arcade | Game | Classic retro arcade game |
| Quiz Master | Game / AI | Trivia + dynamic AI question generator |

> Built with modern React 19, Tailwind CSS, and Google Gemini AI.
`,
  meeting: `# Team Sync Meeting Notes 📋
**Date**: ${new Date().toLocaleDateString()}
**Attendees**: Kishan, Alex, Sarah, Jordan

## Agenda
1. Review sprint deliverables
2. Discuss Mini Pokie feature roadmap
3. Security & threat modeling analysis

## Key Discussions
- Prioritizing browser-first performance and responsive mobile design.
- Fallback ladder integration for AI utilities.

## Action Items
- [ ] Implement responsive canvas controls for touch devices
- [ ] Review OWASP Top 10 security standards
- [x] Configure production-grade build pipeline
`,
  journal: `# Daily Engineering Log ✍️
*Focus of the day*: High-performance client architectures

### Morning Reflections
Started the day streamlining the modular app registry. The goal is to make registering new tools require only one configuration object and component.

### Breakthroughs
- Implemented Web Audio API sound synthesis without external audio assets.
- Integrated automated fallback ladder for Gemini AI requests.

### Next Steps
- Add further offline calculation tools and games.
`,
};

export const MarkdownEditorApp: React.FC = () => {
  const [content, setContent] = useState<string>(TEMPLATES.readme);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [copied, setCopied] = useState<"md" | "html" | null>(null);

  // Parse markdown into HTML safely without dangerous eval
  const renderedHtml = useMemo(() => {
    // Basic safe markdown parser for preview
    let html = content
      // Escape HTML tags to prevent XSS
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks ```lang ... ```
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
      return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl my-4 overflow-x-auto text-xs font-mono leading-relaxed border border-slate-800"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-xs font-mono font-medium">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-4 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">$1</h1>');

    // Blockquote
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-2 my-4 rounded-r-lg text-slate-700 dark:text-slate-300 italic text-sm">$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del class="line-through text-slate-400">$1</del>');

    // Checkboxes
    html = html.replace(/^- \[x\] (.*$)/gim, '<li class="flex items-center gap-2 text-slate-700 dark:text-slate-300 my-1"><span class="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span><span class="line-through text-slate-400">$1</span></li>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<li class="flex items-center gap-2 text-slate-700 dark:text-slate-300 my-1"><span class="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-xs"></span><span>$1</span></li>');

    // Unordered lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300 my-1">$1</li>');

    // Simple Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter((c) => c.trim().length > 0);
      if (cells.some((c) => c.includes("---"))) {
        return ""; // Separator row
      }
      const isHeader = !html.includes("<table");
      const tag = isHeader ? "th" : "td";
      const cellHtml = cells
        .map(
          (c) =>
            `<${tag} class="border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-left ${
              tag === "th" ? "bg-slate-100 dark:bg-slate-800 font-semibold" : ""
            }">${c.trim()}</${tag}>`
        )
        .join("");
      return `<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">${cellHtml}</tr>`;
    });

    // Wrap contiguous trs in table
    html = html.replace(/(<tr[\s\S]*?<\/tr>)+/g, '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-300 dark:border-slate-700 text-sm">$1</table></div>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">$1</a>');

    // Paragraphs
    html = html
      .split("\n\n")
      .map((para) => {
        if (
          para.startsWith("<h") ||
          para.startsWith("<pre") ||
          para.startsWith("<blockquote") ||
          para.startsWith("<div") ||
          para.startsWith("<li")
        ) {
          return para;
        }
        return `<p class="my-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">${para.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");

    return html;
  }, [content]);

  // Statistics
  const words = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  const chars = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Insert helper
  const insertSyntax = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  const handleExportMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `document-${Date.now()}.md`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document - Mini Pokie</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #475569; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  ${renderedHtml}
</body>
</html>`;

    const blob = new Blob([fullHtmlDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `document-${Date.now()}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (type: "md" | "html") => {
    const textToCopy = type === "md" ? content : renderedHtml;
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div id="markdown-editor-app" className="max-w-7xl mx-auto space-y-4">
      {/* Header & Tooling Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Markdown Live Studio</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive split editor with live formatted preview, templates & export.
            </p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Template picker */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Template:
            </span>
            <button
              onClick={() => setContent(TEMPLATES.readme)}
              className="text-xs px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              README
            </button>
            <button
              onClick={() => setContent(TEMPLATES.meeting)}
              className="text-xs px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              Meeting
            </button>
            <button
              onClick={() => setContent(TEMPLATES.journal)}
              className="text-xs px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              Journal
            </button>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("edit")}
              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                viewMode === "edit" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
              title="Editor Only"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`p-1.5 rounded-lg text-xs font-medium transition hidden md:flex items-center gap-1 ${
                viewMode === "split" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`p-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                viewMode === "preview" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
              title="Preview Only"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export / Copy buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportMd}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> .MD
            </button>
            <button
              onClick={handleExportHtml}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> .HTML
            </button>
            <button
              onClick={() => handleCopy("md")}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700"
              title="Copy Raw Markdown"
            >
              {copied === "md" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button onClick={() => insertSyntax("**", "**")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Bold"><Bold className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("*", "*")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Italic"><Italic className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("~~", "~~")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        <button onClick={() => insertSyntax("# ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("## ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("### ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        <button onClick={() => insertSyntax("> ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Quote"><Quote className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("`", "`")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Inline Code"><Code className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("```typescript\n", "\n```")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-mono" title="Code Block">{"{}"}</button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        <button onClick={() => insertSyntax("- ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Bullet List"><List className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("1. ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("- [ ] ")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Task Item"><CheckSquare className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Data 1 | Data 2 |\n")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Table"><TableIcon className="w-4 h-4" /></button>
        <button onClick={() => insertSyntax("[Link Text](", "https://example.com)")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300" title="Link"><Link className="w-4 h-4" /></button>
      </div>

      {/* Editor & Preview Area */}
      <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor Box */}
        {(viewMode === "split" || viewMode === "edit") && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" /> Source Markdown
              </span>
              <span className="font-mono text-[11px] text-slate-400">{chars} chars</span>
            </div>
            <textarea
              id="markdown-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your markdown here..."
              className="w-full flex-1 p-4 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              spellCheck="false"
            />
          </div>
        )}

        {/* Formatted Preview Box */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" /> Formatted Output Preview
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="w-3 h-3" /> Live Render
              </span>
            </div>
            <div
              className="w-full flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>

      {/* Metrics footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-slate-800 dark:text-slate-200">{words}</strong></span>
          <span>Characters: <strong className="text-slate-800 dark:text-slate-200">{chars}</strong></span>
          <span>Est. Reading Time: <strong className="text-slate-800 dark:text-slate-200">{readingTime} min</strong></span>
        </div>
        <span className="text-[11px] text-slate-400">Instant offline render • No telemetry</span>
      </div>
    </div>
  );
};
