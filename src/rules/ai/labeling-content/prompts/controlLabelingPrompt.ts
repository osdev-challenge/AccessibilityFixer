// src/rules/ai/labeling-content/prompts/controlHasAssociatedLabelPrompt.ts
import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildControlHasAssociatedLabelPrompt(c: LabelingContext): string {
  return [
    "You are fixing labeling accessibility for a form control in JSX.",
    "",
    "Goal: Ensure the control has an accessible name.",
    "",
    "Preferred options (in order):",
    "1) Visible <label htmlFor> with a matching id on the control.",
    "2) aria-labelledby referencing EXISTING visible text by id.",
    "3) aria-label with concise human text (only if 1 or 2 is not feasible).",
    "",
    "Rules:",
    "- Keep the diff minimal; do NOT refactor unrelated code.",
    "- If an adequate visible label already exists, do NOT add aria-label.",
    "- Choose a short neutral label if nothing is available (e.g., 'Search', 'Email').",
    "- Avoid duplicate naming mechanisms for the same control.",
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
    `- associatedLabelText: ${c.associatedLabelText ?? ""}`,
    `- neighborText: ${c.neighborText ?? ""}`,
    `- controlType: ${c.controlType ?? ""}`,
    `- isFormAncestor: ${String(c.isFormAncestor)}`,
  ].join("\n");
}
