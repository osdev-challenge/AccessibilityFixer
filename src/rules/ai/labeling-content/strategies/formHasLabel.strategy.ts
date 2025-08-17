import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { addAriaLabel } from "../../../../utils/codeMods";
import { buildControlLabelingPrompt } from "../prompts/controlLabelingPrompt";
import { approveOrNull } from "../../../../utils/scoring";

const TYPE_LABEL: Record<string, string> = {
  email: "Email", password: "Password", search: "Search", tel: "Phone", url: "URL", number: "Number",
};
function deriveControlLabel(attrs: Record<string, any>): string | null {
  const type = String(attrs["type"] || "").toLowerCase();
  if (TYPE_LABEL[type]) return TYPE_LABEL[type];
  const name = String(attrs["name"] || "").replace(/[_\-]+/g, " ").trim();
  if (name) return name[0].toUpperCase() + name.slice(1);
  const placeholder = String(attrs["placeholder"] || "").trim();
  if (placeholder) return placeholder.slice(0, 30);
  return null;
}

export const FormHasLabelStrategy = {
  name: "form-has-label",
  buildPrompt: buildControlLabelingPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    if (!ctx.isFormControl) return null;
    if (ctx.hasAriaLabel || !!ctx.innerText?.trim()) return null;

    const derived = deriveControlLabel(ctx.attributes);
    const label = derived || "Field";
    const out = addAriaLabel(ctx.snippet, label);

    return approveOrNull(out, [derived ? "derivedControl" : "defaultControl"]);
  },
};
