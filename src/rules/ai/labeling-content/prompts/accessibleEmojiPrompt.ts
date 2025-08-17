// src/rules/ai/labeling-content/prompts/accessibleEmojiPrompt.ts
import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildAccessibleEmojiPrompt(c: LabelingContext): string {
  return [
    "You are fixing an accessibility issue in JSX related to emojis.",
    "",
    "Task:",
    "- If the emoji conveys meaning, ensure screen readers announce a concise label.",
    "  Prefer wrapping the emoji with: <span role=\"img\" aria-label=\"...\">😃</span>",
    "- If the emoji is purely decorative, hide it from screen readers with aria-hidden=\"true\".",
    "",
    "Rules:",
    "- Keep the diff minimal; do NOT refactor unrelated code or change styles.",
    "- Use a short, human-friendly aria-label (no words like 'emoji', no colons/prefixes).",
    "- Avoid duplicating visible text in aria-label if the meaning is already conveyed.",
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
    "Context hints (may help determine meaning vs decorative):",
    `- neighborText: ${c.neighborText ?? ""}`,
    `- textContent: ${c.textContent ?? ""}`,
    `- emojiSequence: ${(c.emojiSequence ?? []).join(" ")}`,
  ].join("\n");
}
