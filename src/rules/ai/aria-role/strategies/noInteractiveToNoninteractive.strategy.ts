import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildNoInteractiveToNoninteractivePrompt } from "../prompts/noInteractiveElementToNoninteractiveRolePrompt";
import { isValidRole, isNativeConflictRole } from "../../../../utils/ariaSpec";
import { removeRoleAst } from "../../../../utils/codeMods";
import { approveOrNull } from "../../../../utils/scoring";

function isPresentational(role: string) {
  return role === "presentation" || role === "none";
}

export const NoInteractiveElementToNoninteractiveRoleStrategy: RuleStrategy<ElementA11yContext> = {
  id: "no-interactive-element-to-noninteractive-role",

  tryLogic(ctx) {
    const role = ctx.role ?? null;
    if (!role) return null;

    if (!ctx.nativeInteractive) return null; 

    let evidence: ("invalidRole" | "presentationalOnInteractive" | "roleConflict") | null = null;

    if (!isValidRole(role)) evidence = "invalidRole";
    else if (isPresentational(role)) evidence = "presentationalOnInteractive";
    else if (isNativeConflictRole(ctx.elementName, role)) evidence = "roleConflict";

    if (!evidence) return null;

    const fixed = removeRoleAst(ctx.code);
    return fixed !== ctx.code ? approveOrNull(fixed, [evidence]) : null;
  },

  buildPrompt: buildNoInteractiveToNoninteractivePrompt,
  parseResponse: parseFixedCodeJson
};
