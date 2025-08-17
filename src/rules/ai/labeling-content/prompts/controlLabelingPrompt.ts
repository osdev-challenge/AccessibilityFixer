import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildControlLabelingPrompt(ctx: ElementLabelingContext) {
  return [
    "You ensure form controls have an accessible name.",
    "Prefer <label htmlFor> or wrapping <label>, else aria-label/aria-labelledby.",
    "Avoid duplication; keep IDs stable.",
    "Return JSON only: { \"fixedCode\": \"<JSX ...>...</JSX>\" }",
    `snippet:\n${ctx.snippet}`,
    `neighbor:\n${ctx.neighborLines}`,
  ].join("\n");
}
