import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildAriaRolePrompt } from "../prompts/ariaRolePrompt";
import { isValidRole, isNativeConflictRole } from "../../../../utils/ariaSpec";
import { removeRoleAst } from "../../../../utils/codeMods";

export const AriaRoleStrategy: RuleStrategy<ElementA11yContext> = {
  id: "aria-role",

  canFixByLogic(ctx) {
    const role = ctx.role ?? null;
    if (!role) return false;
    if (!isValidRole(role)) return true;
    return isNativeConflictRole(ctx.elementName, role);
  },

  applyLogicFix(ctx) {
    const fixed = removeRoleAst(ctx.code);
    return fixed !== ctx.code ? fixed : null;
  },

  buildPrompt(ctx) {
    return buildAriaRolePrompt(ctx);
  },

  parseResponse(resp) {
    return parseFixedCodeJson(resp);
  }
};
