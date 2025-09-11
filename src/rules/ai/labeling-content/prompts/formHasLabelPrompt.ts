import { LabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildFormHasLabelPrompt(c: LabelingContext): string {
  return [
    "You are ensuring that controls within a <form> are properly labeled in JSX.",
    "",
    "Task:",
    "- Add or connect labels to direct form controls if they lack an accessible name.",
    "",
    "Guidelines:",
    "- DO NOT label the <form> element itself.",
    "- Prefer <label htmlFor> + id; else use aria-labelledby; else aria-label.",
    "- Keep changes minimal and avoid structural refactors.",
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
    `- neighborText: ${c.neighborText ?? ""}`,
    `- isFormAncestor: ${String(c.isFormAncestor)}`,
  ].join("\n");
}
