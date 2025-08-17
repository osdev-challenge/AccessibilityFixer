import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { addAriaLabel } from "../../../../utils/codeMods";
import { buildRequireAriaLabelPrompt } from "../prompts/requireAriaLabelPrompt";
import { approveOrNull } from "../../../../utils/scoring";

const ACTION_DICT: Array<{ r: RegExp; label: string }> = [
  { r: /\b(delete|remove|trash)\b/i, label: "Delete" },
  { r: /\b(close|dismiss|cancel)\b/i, label: "Close" },
  { r: /\b(save|apply|submit)\b/i, label: "Save" },
  { r: /\b(download)\b/i, label: "Download" },
  { r: /\b(edit)\b/i, label: "Edit" },
  { r: /\b(refresh|reload)\b/i, label: "Refresh" },
];

function chooseAction(neighbor: string, attrs: Record<string, any>): string | null {
  const hay = [neighbor, String(attrs["class"]||""), String(attrs["id"]||""), String(attrs["name"]||"")].join(" ");
  const hit = ACTION_DICT.find(d => d.r.test(hay));
  return hit?.label ?? null;
}

export const RequireAriaLabelStrategy = {
  name: "require-aria-label",
  buildPrompt: buildRequireAriaLabelPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    const interactive =
      ctx.openingTag === "button" ||
      (ctx.openingTag === "a" && !!ctx.innerText?.trim()) ||
      ctx.attributes["role"] === "button";
    if (!interactive) return null;

    const hasVisible = !!ctx.innerText?.trim();
    const hasAria = ctx.hasAriaLabel;
    if (hasVisible || hasAria) return null;

    const action = chooseAction(ctx.neighborLines, ctx.attributes);
    const label = action || "Action";
    const out = addAriaLabel(ctx.snippet, label);

    return approveOrNull(out, [action ? "actionDerived" : "actionFallback"]);
  },
};
