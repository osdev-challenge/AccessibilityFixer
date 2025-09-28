import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractElementA11yContext } from "../../../../ai/context/extractElementA11yContext";
import { runAIFix, AiFixResult } from "../../../../ai/pipelines/runAIFix";
import { NoInteractiveElementToNoninteractiveRoleStrategy } from "../strategies/noInteractiveToNoninteractive.strategy";
import { getGpt } from "../../../../ai/aiSingleton";

import { findElementRanges } from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";

export async function fixNoInteractiveToNoninteractive(
  rc: RuleContext
): Promise<vscode.CodeAction[]> {
  const ctx = extractElementA11yContext(rc);
  const callGpt = getGpt();

  const result: AiFixResult = await runAIFix(
    NoInteractiveElementToNoninteractiveRoleStrategy,
    ctx,
    callGpt,
    {
      log: true,
      ruleName: "no-interactive-element-to-noninteractive-role",
      validateJsx: true,
    }
  );

  if (result.kind === "whole-element") {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "Apply AI: no-interactive-element-to-noninteractive-role"
      );
      return [replaceAction];
    } else {
      console.warn(
        "[A11Y][no-interactive-element-to-noninteractive-role] Could not find element ranges to apply whole-element fix."
      );
    }
  }

  return [];
}
