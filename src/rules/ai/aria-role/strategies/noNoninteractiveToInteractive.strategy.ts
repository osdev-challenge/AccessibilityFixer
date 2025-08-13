import { RuleStrategy } from "../../../../ai/pipelines/runAIFix";
import { ElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { parseFixedCodeJson } from "../../../../ai/pipelines/parsers";
import { buildRoleConflictPrompt } from "../prompts/roleConflictPrompt";
import { removeRoleAst } from "../../../../utils/codeMods";

export const NoNoninteractiveToInteractiveStrategy: RuleStrategy<ElementA11yContext> = {
  id: "no-noninteractive-element-to-interactive-role",

  canFixByLogic(ctx) {
    const interactiveRoles = new Set([
      "button","link","checkbox","switch","textbox","searchbox","combobox","menuitem",
      "menuitemcheckbox","menuitemradio","option","radio","slider","spinbutton","tab","treeitem","gridcell"
    ]);
    const role = (ctx.role || "").toLowerCase();
    const providesInteraction = ctx.hasHandlers || !!ctx.href || (typeof ctx.tabIndex === "number" && ctx.tabIndex >= 0);
    return !!(role && interactiveRoles.has(role) && !providesInteraction);
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
