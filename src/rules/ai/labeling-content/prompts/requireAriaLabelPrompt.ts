import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildRequireAriaLabelPrompt(ctx: ElementLabelingContext) {
  return [
    "You add missing accessible name to an interactive control in JSX.",
    "Prefer visible text; otherwise aria-label/aria-labelledby.",
    "Do not duplicate labels or change control behavior.",
    "Return JSON only: { \"fixedCode\": \"<JSX ...>...</JSX>\" }",
    `snippet:\n${ctx.snippet}`,
    `neighbor:\n${ctx.neighborLines}`,
  ].join("\n");
}
