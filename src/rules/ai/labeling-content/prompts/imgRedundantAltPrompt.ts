// src/rules/ai/labeling-content/prompts/imgRedundantAltPrompt.ts
import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

const REDUNDANT = ["image of", "picture of", "photo of", "graphic of", "icon", "logo"];

function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export function buildImgRedundantAltPrompt(c: LabelingContext): string {
  return [
    "You are fixing an accessibility issue: the <img> alt text is redundant or verbose.",
    "",
    "Task:",
    "- Rewrite alt to be concise, removing generic words like: " + REDUNDANT.join(", "),
    "- If the image is purely decorative or meaning is unclear, set alt=\"\".",
    "",
    "Guidance:",
    "- Use hints from nearby text, figcaption, or filename base; do not invent details.",
    "- Keep changes minimal and do not alter styles/structure.",
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
