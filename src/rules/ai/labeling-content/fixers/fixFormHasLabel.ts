// src/rules/ai/form-has-label/fixers/fixFormHasLabel.ts
import * as vscode from "vscode";
import { RuleContext } from "../../../types";
import { extractLabelingContext, LabelingContext } from "../../../../ai/context/extractLabelingContext";
import { callGpt } from "../../../../ai/aiClient";
import { parseFixedCodeJson, findElementRanges } from "../../../../ai/pipelines/parsers";
import { buildReplaceWholeElementAction } from "../../../../ai/pipelines/codeActions";
import { buildFormHasLabelPrompt } from "../prompts/formHasLabelPrompt";
import { runAIFix, RuleStrategy, AiFixResult } from "../../../../ai/pipelines/runAIFix";

// Inline Strategy 정의
const FormHasLabelStrategy: RuleStrategy<LabelingContext> = {
  id: 'form-has-label',
  buildPrompt: buildFormHasLabelPrompt,
  parseResponse: parseFixedCodeJson,
};

export async function fixFormHasLabel(rc: RuleContext): Promise<vscode.CodeAction[]> {
  const ctx = extractLabelingContext(rc);
  
  const result: AiFixResult = await runAIFix(FormHasLabelStrategy, ctx, callGpt, {
    log: true,
    ruleName: 'form-has-label',
    validateJsx: true,
  });
  
  if (result.kind === 'whole-element') {
    const elementRanges = findElementRanges(rc.document, rc.range.start);

    if (elementRanges) {
      const replaceAction = buildReplaceWholeElementAction(
        rc.document,
        elementRanges.element,
        result.html,
        "Ensure form controls have labels"
      );
      return [replaceAction];
    } else {
      console.warn('[A11Y][form-has-label] Could not find element ranges to apply whole-element fix.');
    }
  }

  return [];
}