import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { ensureId } from "../../../../utils/codeMods";
import { buildControlLabelingPrompt } from "../prompts/controlLabelingPrompt";
import { approveOrNull } from "../../../../utils/scoring";

export const LabelHasForStrategy = {
  name: "label-has-for",
  buildPrompt: buildControlLabelingPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    if (!ctx.isFormControl) return null;
    if (/id\s*=/i.test(ctx.snippet)) return null;

    const generatedId = "input_" + Math.random().toString(36).slice(2, 8);
    const out = ensureId(ctx.snippet, generatedId);

    return approveOrNull(out, ["idDeterministic"]);
  },
};
