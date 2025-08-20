import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildAriaRolePrompt } from "../prompts/ariaRolePrompt";
import { isValidRole, isNativeConflictRole } from "../../../../utils/ariaSpec";
import { removeRoleAst } from "../../../../utils/codeMods";
import { approveOrNull } from "../../../../utils/scoring";

export const AriaRoleStrategy: RuleStrategy<ElementA11yContext> = {
  id: "aria-role",

  tryLogic(ctx) {
    const role = ctx.role ?? null;
    if (!role) return null;

    if (!isValidRole(role)) {
      const fixed = removeRoleAst(ctx.code);
      return fixed !== ctx.code ? approveOrNull(fixed, ["invalidRole"]) : null;
    }
    if (isNativeConflictRole(ctx.elementName, role)) {
      const fixed = removeRoleAst(ctx.code);
      return fixed !== ctx.code ? approveOrNull(fixed, ["roleConflict"]) : null;
    }
    return null;
  },

  buildPrompt: buildAriaRolePrompt,
  parseResponse: parseFixedCodeJson
};
