// src/rules/ai/labeling-content/prompts/requireAriaLabelPrompt.ts
import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildRequireAriaLabelPrompt(c: LabelingContext): string {
  return [
    "You are fixing an accessibility issue: an interactive element lacks an accessible name.",
    "",
    "Task:",
    "- Provide an accessible name using the LEAST invasive method.",
    "",
    "Preferred options:",
    "1) If there is visible text near/inside the element, use aria-labelledby pointing to that text id.",
    "2) Otherwise, add a concise aria-label describing the action/purpose.",
    "",
    "Rules:",
    "- Keep changes minimal; do not restructure other code.",
    "- If the element already has sufficient visible text, DO NOT add aria-label.",
    "- The aria-label must be short and human-friendly (e.g., 'Close', 'Save').",
    "- Avoid duplicate mechanisms (do not use both aria-labelledby and aria-label unless strictly necessary).",
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
    "Context hints:",
    `- roleComputed: ${c.roleComputed ?? ""}`,
    `- textContent: ${c.textContent ?? ""}`,
    `- associatedLabelText: ${c.associatedLabelText ?? ""}`,
    `- neighborText: ${c.neighborText ?? ""}`,
  ].join("\n");
}
