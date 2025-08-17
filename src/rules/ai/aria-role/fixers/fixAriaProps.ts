// src/rules/ai/aria-role/fixers/fixAriaProps.ts
import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix } from "../../../../ai/pipelines/runAIFix";
import { AriaPropsStrategy } from "../strategies/ariaProps.strategy";
import { callGpt } from "../../../../ai/aiClient";
// ✅ 이미 있는 헬퍼 재사용
import { createReplaceAction } from "../../../../ai/pipelines/codeActions";

export async function fixAriaProps(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const fixed = await runAIFix(AriaPropsStrategy, ctx, callGpt, {
    log: true,
    ruleName: "aria-props",
    validateJsx: true,
  });

  // 빈/동일 문자열이면 [] 반환, 변경이면 QuickFix 1개 반환
  return createReplaceAction(rc, fixed, "Apply AI: aria-props");
}
