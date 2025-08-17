import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";

export function buildAccessibleEmojiPrompt(ctx: ElementLabelingContext) {
  return [
    "You fix emoji accessibility in JSX.",
    "If emoji conveys meaning: role=\"img\" + aria-label (short).",
    "If decorative: aria-hidden=\"true\".",
    "Keep other parts unchanged.",
    "Return JSON only: { \"fixedCode\": \"<JSX ...>...</JSX>\" }",
    `snippet:\n${ctx.snippet}`,
    `neighbor:\n${ctx.neighborLines}`,
  ].join("\n");
}
