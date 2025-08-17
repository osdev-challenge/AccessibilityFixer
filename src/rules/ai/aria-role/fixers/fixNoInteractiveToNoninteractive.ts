import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { NoInteractiveElementToNoninteractiveRoleStrategy } from "../strategies/noInteractiveToNoninteractive.strategy";
import { callGpt } from "../../../../ai/aiClient";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";

export async function fixNoInteractiveToNoninteractive(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const fixed = await runAIFix(
    NoInteractiveElementToNoninteractiveRoleStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "no-interactive-element-to-noninteractive-role",
      validateJsx: true,
    }
  );

  return createReplaceAction(
    rc,
    fixed,
    "Apply AI: no-interactive-element-to-noninteractive-role"
  );
}
