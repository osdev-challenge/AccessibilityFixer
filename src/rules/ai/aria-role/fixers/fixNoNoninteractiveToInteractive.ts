import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { NoNoninteractiveElementToInteractiveRoleStrategy } from "../strategies/noNoninteractiveToInteractive.strategy";
import { callGpt } from "../../../../ai/aiClient";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";

export async function fixNoNoninteractiveToInteractive(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const fixed = await runAIFix(
    NoNoninteractiveElementToInteractiveRoleStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "no-noninteractive-element-to-interactive-role",
      validateJsx: true,
    }
  );

  return createReplaceAction(
    rc,
    fixed,
    "Apply AI: no-noninteractive-element-to-interactive-role"
  );
}
