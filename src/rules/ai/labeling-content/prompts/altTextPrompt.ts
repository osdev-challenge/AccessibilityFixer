// src/rules/ai/labeling-content/prompts/altTextPrompt.ts
import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

const STOPWORDS = [
  "image","picture","photo","graphic","img","icon","logo","background",
  "of","the","a","an"
];

function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export function buildAltTextPrompt(c: LabelingContext): string {
  return [
    "You are fixing an accessibility issue in JSX for <img> elements.",
    "",
    "Tasks:",
    "1) If alt is missing/empty but the image is informative, add a concise, human alt.",
    "2) If the image is decorative, set alt=\"\".",
    "3) If alt is redundant (repeats filename/caption or uses generic words like 'image of', 'icon'), rewrite succinctly.",
    "",
    "Rules:",
    "- Keep the change minimal; do NOT alter unrelated code or styles.",
    "- Avoid these words: " + STOPWORDS.join(", "),
    "- Prefer hints from nearby text, figcaption, or filename base. Do NOT hallucinate details.",
    "- If meaning is unclear, prefer alt=\"\" (decorative).",
    "",
    "Output format:",
    '- Return ONLY a JSON object: { "fixedCode": "<JSX...>" }',
    "- If you cannot produce JSON, return ONLY the patched JSX code block.",
    "",
    `File path: ${c.filePath}`,
    `Line: ${c.line}`,
    "",
    "Original snippet:",
    "```jsx",
    c.snippet,
    "```",
    "",
    "Hints:",
    `- neighborText: ${clean(c.neighborText)}`,
    `- figureCaption: ${clean(c.figureCaption)}`,
    `- srcFilenameBase: ${clean(c.srcFilenameBase)}`,
  ].join("\n");
}
