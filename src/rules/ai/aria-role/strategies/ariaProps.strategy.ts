import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildAriaPropsPrompt } from "../prompts/ariaPropsPrompt";
import { removeInvalidAriaPropsAst } from "../../../../utils/codeMods";
import { approveOrNull } from "../../../../utils/scoring";

export const AriaPropsStrategy: RuleStrategy<ElementA11yContext> = {
  id: "aria-props",

  tryLogic(ctx) {
    const fixed = removeInvalidAriaPropsAst(ctx.code);
    return fixed !== ctx.code ? approveOrNull(fixed, ["deterministic"]) : null;
  },

  buildPrompt: buildAriaPropsPrompt,
  parseResponse: parseFixedCodeJson
};
