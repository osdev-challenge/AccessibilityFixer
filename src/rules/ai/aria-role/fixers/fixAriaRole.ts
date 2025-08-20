// src/rules/ai/aria-role/fixers/fixAriaRole.ts
import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix, AiFixResult } from "../../../../ai/pipelines/runAIFix";
import { AriaRoleStrategy } from "../strategies/ariaRole.strategy";
import { callGpt } from "../../../../ai/aiClient";

// ✅ B안을 위해 새로 추가/변경된 함수들을 import 합니다.
import { findElementRanges } from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";

export async function fixAriaRole(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const result: AiFixResult = await runAIFix(AriaRoleStrategy, ctx, callGpt, {
    log: true,
    ruleName: "aria-role",
    validateJsx: true,
  });

  if (result.kind === "whole-element") {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "Apply AI: Fix aria-role (replace element)"
      );
      return [replaceAction];
    } else {
      console.warn('[A11Y][aria-role] Could not find element ranges to apply whole-element fix.');
    }
  }
  
  return [];
}