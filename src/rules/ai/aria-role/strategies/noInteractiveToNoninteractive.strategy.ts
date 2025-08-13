import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildRoleConflictPrompt } from "../prompts/roleConflictPrompt";
import { removeRoleAst } from "../../../../utils/codeMods";

export const NoInteractiveToNoninteractiveStrategy: RuleStrategy<ElementA11yContext> = {
  id: "no-interactive-element-to-noninteractive-role",

  canFixByLogic(ctx) {
    const role = (ctx.role || "").toLowerCase();
    const nonInteractiveRoles = new Set(["none", "presentation", "img", "article", "region"]);
    return !!(ctx.nativeInteractive && role && nonInteractiveRoles.has(role));
  },

  applyLogicFix(ctx) {
    const fixed = removeRoleAst(ctx.code);
    return fixed !== ctx.code ? fixed : null;
  },

  buildPrompt(ctx) {
    return buildRoleConflictPrompt(ctx);
  },

  parseResponse(resp) {
    return parseFixedCodeJson(resp);
  }
};
