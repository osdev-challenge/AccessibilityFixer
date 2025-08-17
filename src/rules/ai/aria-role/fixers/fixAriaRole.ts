// src/rules/ai/aria-role/fixers/fixAriaRole.ts
import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AriaRoleStrategy } from "../strategies/ariaRole.strategy";
import { callGpt } from "../../../../ai/aiClient";
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";

export async function fixAriaRole(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const fixed = await runAIFix(AriaRoleStrategy, ctx, callGpt, {
    log: true,
    ruleName: "aria-role",
    validateJsx: true,
  });
  return createReplaceAction(rc, fixed, "Apply AI: aria-role");
}
