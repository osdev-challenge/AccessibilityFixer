import { ElementLabelingContext } from "../../../../ai/context/extractLabelingContext";
import { removeRedundantAlt } from "../../../../utils/codeMods";
import { buildAltTextPrompt } from "../prompts/altTextPrompt";
import { approveOrNull } from "../../../../utils/scoring";

export const ImgRedundantAltStrategy = {
  name: "img-redundant-alt",
  buildPrompt: buildAltTextPrompt,
  tryLogic(ctx: ElementLabelingContext): string | null {
    if (!ctx.isImage) return null;
    if (!/alt\s*=/i.test(ctx.snippet)) return null;

    const cleaned = removeRedundantAlt(ctx.snippet);
    if (cleaned === ctx.snippet) return null;

    return approveOrNull(cleaned, ["deterministic"]);
  },
};
