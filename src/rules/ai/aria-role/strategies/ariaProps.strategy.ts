import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildAriaPropsPrompt } from "../prompts/ariaPropsPrompt";
import { isValidAriaProp } from "../../../../utils/ariaSpec";
import { removeInvalidAriaPropsAst } from "../../../../utils/codeMods";

export const AriaPropsStrategy: RuleStrategy<ElementA11yContext> = {
  id: "aria-props",

  canFixByLogic(ctx) {
    return ctx.ariaProps.some(p => !isValidAriaProp(p.name));
  },

  applyLogicFix(ctx) {
    const fixed = removeInvalidAriaPropsAst(ctx.code);
    return fixed !== ctx.code ? fixed : null;
  },

  buildPrompt(ctx) {
    return buildAriaPropsPrompt(ctx);
  },

  parseResponse(resp) {
    return parseFixedCodeJson(resp);
  }
};
