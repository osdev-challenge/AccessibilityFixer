import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildAltTextPrompt(ctx: ElementLabelingContext) {
  return [
    "You fix web accessibility for JSX.",
    "Task: Return a corrected JSX snippet with a proper alt for images.",
    "- Never use ‘image/picture/photo/graphic’ in alt.",
    "- Be specific and concise; if decorative, use alt=\"\".",
    "Return JSON only: { \"fixedCode\": \"<JSX ...>...</JSX>\" }",
    "Context:",
    `snippet:\n${ctx.snippet}`,
    `neighbor:\n${ctx.neighborLines}`,
  ].join("\n");
}
